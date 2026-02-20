from django.http import JsonResponse, FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response 
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.shortcuts import render
from .products import products
from .models import Product, Order, OrderItem, ShippingAddress, Wishlist
from .serializers import ProductSerializer, OrderSerializer
from .serializers import ContactMessageSerializer
from django.contrib.auth.models import User
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from .serializers import UserSerializer, UserSerializer
from .email_utils import (
    send_order_confirmation_email,
    send_payment_confirmation_email,
    send_order_shipped_email,
)
from .invoice_utils import generate_invoice_html, generate_invoice_filename, generate_pdf_from_html

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.views.generic import View


def serve_frontend(request):
    """Serve the frontend React app index.html.

    Expects `frontend/build/index.html` to exist (run `npm run build` in `frontend`).
    """
    try:
        return render(request, 'index.html')
    except Exception:
        # If template not found, return a minimal response indicating build is missing
        return JsonResponse({'detail': 'Frontend build not found. Run `npm run build` in frontend.'}, status=404)


def serve_admin_panel(request):
    """Serve the admin-panel React app index.html.

    Expects `admin-panel/build/index.html` to exist (run `npm run build` in `admin-panel`).
    """
    try:
        return render(request, 'index.html')
    except Exception:
        return JsonResponse({'detail': 'Admin build not found. Run `npm run build` in admin-panel.'}, status=404)

 

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
     @classmethod
     def get_token(cls, user):
         token = super().get_token(user)

         # Add custom claims
         token['username'] = user.username
         token['email'] = user.email
         return token 

     def validate(self, attrs):
         # Accept either 'username' or 'email' for login
         if 'email' in attrs and 'username' not in attrs:
             User = get_user_model()
             try:
                 user = User.objects.get(email=attrs.get('email'))
                 attrs['username'] = user.username
             except User.DoesNotExist:
                 pass

         data = super().validate(attrs)
         # Attach user data to response so frontend receives user info + token
         from .serializers import UserSerializerWithToken
         user_data = UserSerializerWithToken(self.user).data
         # Ensure the access token (from SimpleJWT) is used as `token` for frontend compatibility
         user_data['token'] = data.get('access')
         # Merge user fields into response
         data.update(user_data)
         return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class MyTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        access = AccessToken(data.get('access'))
        user_id = access.get('user_id')
        if user_id:
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
                access['username'] = user.username
                access['email'] = user.email
                data['access'] = str(access)
            except User.DoesNotExist:
                pass
        return data

class MyTokenRefreshView(TokenRefreshView):
    serializer_class = MyTokenRefreshSerializer

@api_view(['POST'])
def passwordResetRequest(request):
    email = request.data.get('email')
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        link = f"{frontend_base}/password-reset-confirm/?uid={uid}&token={token}"
        subject = 'Password reset for mamigloexclusive'
        message = f'Hello {user.username},\n\nUse the following link to reset your password:\n{link}\n\nIf you did not request this, please ignore.'
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
    except Exception:
        # do not reveal whether user exists
        pass
    return Response({'detail': 'If an account with that email exists, we sent password reset instructions.'})

@api_view(['POST'])
def passwordResetConfirm(request):
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    try:
        uid_decoded = force_str(urlsafe_base64_decode(uid))
        User = get_user_model()
        user = User.objects.get(pk=uid_decoded)
    except Exception:
        return Response({'detail': 'Invalid token or uid'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'detail': 'Invalid token or uid'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password has been set.'})

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def getUserProfile(request):
    user = request.user
    if request.method == 'GET':
        # Return detailed user info including isAdmin so frontends can verify role
        from .serializers import UserSerializerWithToken
        serializer = UserSerializerWithToken(user, many=False)
        return Response(serializer.data)

    if request.method == 'PUT':
        data = request.data
        user.first_name = data.get('name', user.first_name)
        user.email = data.get('email', user.email)
        if data.get('password'):
            user.set_password(data.get('password'))
        user.save()
        # Return user data with a fresh access token
        from .serializers import UserSerializerWithToken
        serializer = UserSerializerWithToken(user, many=False)
        return Response(serializer.data)

@api_view(['POST'])
def registerUser(request):
    data = request.data
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    User = get_user_model()
    if User.objects.filter(email=email).exists():
        return Response({'detail': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=email, email=email, first_name=name)
    user.set_password(password)
    user.save()

    from .serializers import UserSerializerWithToken
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    data = UserSerializerWithToken(user, many=False).data
    # Include refresh & access tokens
    data['token'] = access
    data['access'] = access
    data['refresh'] = str(refresh)
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def loginUser(request):
    data = request.data
    identifier = data.get('email') or data.get('username')
    password = data.get('password')

    User = get_user_model()
    try:
        user = User.objects.get(email=identifier)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    from django.contrib.auth import authenticate
    user_auth = authenticate(request, username=user.username, password=password)
    if not user_auth:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    access_token['username'] = user.username
    access_token['email'] = user.email

    data = {
        'refresh': str(refresh),
        'access': str(access_token),
    }

    from .serializers import UserSerializerWithToken
    user_data = UserSerializerWithToken(user).data
    user_data['token'] = data['access']
    data.update(user_data)

    return Response(data)

@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/products/',
        '/api/token/',
        '/api/token/refresh/',
        '/api/users/register/',
        '/api/users/login/',
        '/api/users/profile/',
        '/api/orders/',
        '/api/users/profile/',
    ]
    return  Response(routes,)  

@api_view(['POST'])
@permission_classes([IsAdminUser])
def createProduct(request):
    """Admin-only product creation"""
    data = request.data
    serializer = ProductSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def getProducts(request):
    # Public product list with pagination, search, and filtering
    # Also accept POST for admin product creation at the same endpoint
    if request.method == 'POST':
        # Require admin privileges to create products
        if not request.user or not request.user.is_authenticated or not request.user.is_staff:
            return Response({'detail': 'Not authorized to create products'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data
        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    products_list = Product.objects.all().order_by('-created_at')
    
    # Search by name or category
    query = request.query_params.get('search') or request.query_params.get('q') or request.GET.get('q')
    if query:
        from django.db.models import Q
        products_list = products_list.filter(
            Q(name__icontains=query) | Q(category__icontains=query) | Q(description__icontains=query)
        )
    
    # Filter by category
    category = request.query_params.get('category') or request.GET.get('category')
    if category:
        products_list = products_list.filter(category__iexact=category)
    
    # Filter by price range
    min_price = request.query_params.get('min_price') or request.GET.get('min_price')
    max_price = request.query_params.get('max_price') or request.GET.get('max_price')
    if min_price:
        try:
            products_list = products_list.filter(price__gte=float(min_price))
        except (ValueError, TypeError):
            pass
    if max_price:
        try:
            products_list = products_list.filter(price__lte=float(max_price))
        except (ValueError, TypeError):
            pass
    
    # Filter by rating (minimum rating)
    min_rating = request.query_params.get('rating') or request.GET.get('rating')
    if min_rating:
        try:
            products_list = products_list.filter(rating__gte=float(min_rating))
        except (ValueError, TypeError):
            pass
    
    # Filter by in-stock items only
    in_stock_only = request.query_params.get('in_stock') or request.GET.get('in_stock')
    if in_stock_only and in_stock_only.lower() in ['true', '1', 'yes']:
        products_list = products_list.filter(countInStock__gt=0)
    
    # Sorting
    sort = request.query_params.get('sort') or request.GET.get('sort')
    if sort:
        if sort == 'price_asc':
            products_list = products_list.order_by('price')
        elif sort == 'price_desc':
            products_list = products_list.order_by('-price')
        elif sort == 'rating':
            products_list = products_list.order_by('-rating')
        elif sort == 'newest':
            products_list = products_list.order_by('-created_at')

    page = request.query_params.get('page') or request.GET.get('page') or 1
    page_size = request.query_params.get('page_size') or request.GET.get('page_size') or 10
    paginator = Paginator(products_list, page_size)
    try:
        products_page = paginator.page(page)
    except PageNotAnInteger:
        products_page = paginator.page(1)
    except EmptyPage:
        products_page = []

    serializer = ProductSerializer(products_page, many=True)
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': int(page),
    })

@api_view(['GET','PUT','PATCH','DELETE'])
@permission_classes([AllowAny])
def productDetail(request, pk):
    # Check for admin permission only on write operations
    if request.method in ['PUT', 'PATCH', 'DELETE']:
        if not request.user or not request.user.is_staff:
            return Response({'detail': 'Admin authentication required'}, status=status.HTTP_403_FORBIDDEN)
    
    # Guard against invalid ids (e.g., frontend sending 'undefined') to avoid ValueError -> 500
    try:
        product = Product.objects.get(_id=pk)
    except ValueError:
        return Response({'detail': 'Invalid product id'}, status=status.HTTP_400_BAD_REQUEST)
    except Product.DoesNotExist:
        # Fallback to static products data
        product = None
        try:
            pid = int(pk)
        except (ValueError, TypeError):
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        for i in products:
            if i['_id'] == pid:
                product = i
                break
        if not product:
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        # If product comes from the static fallback (a dict), only allow GET.
        # Attempts to DELETE/PUT/PATCH a static dict would raise server errors (500).
        if request.method != 'GET':
            return Response({'detail': 'Cannot modify static product'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    if request.method == 'GET':
        serializer = ProductSerializer(product, many=False)
        return Response(serializer.data)

    if request.method in ['PUT', 'PATCH']:
        try:
            # Sanitize incoming data to only include model fields (prevents unknown-field errors)
            raw = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
            files = getattr(request, 'FILES', {})
            allowed_fields = {f.name for f in Product._meta.fields}
            filtered = {k: v for k, v in raw.items() if k in allowed_fields}
            for k in files:
                if k in allowed_fields:
                    filtered[k] = files[k]

            serializer = ProductSerializer(product, data=filtered, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Log full traceback to console for debugging and return a safe error
            import traceback
            traceback.print_exc()
            return Response({'detail': 'Server error while updating product', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if request.method == 'DELETE':
        try:
            product.delete()
            return Response({'detail': 'Product deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'detail': 'Server error while deleting product', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def getUsers(request):
    users = User.objects.all().order_by('-id')
    query = request.query_params.get('search') or request.query_params.get('q') or request.GET.get('q')
    if query:
        from django.db.models import Q
        users = users.filter(Q(username__icontains=query) | Q(email__icontains=query))

    page = request.query_params.get('page') or request.GET.get('page') or 1
    page_size = request.query_params.get('page_size') or request.GET.get('page_size') or 10
    paginator = Paginator(users, page_size)
    try:
        users_page = paginator.page(page)
    except PageNotAnInteger:
        users_page = paginator.page(1)
    except EmptyPage:
        users_page = []

    serializer = UserSerializer(users_page, many=True)
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': int(page),
    })


@api_view(['GET','POST'])
def contactMessages(request):
    """Public POST to create a message; admin GET to list messages"""
    if request.method == 'POST':
        data = request.data
        try:
            user = request.user if request.user and request.user.is_authenticated else None
        except Exception:
            user = None
        # Require authenticated user to create messages
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        # Try direct model creation to avoid potential serializer/import/circular issues
        try:
            from .models import ContactMessage
            # prefer authenticated user's email if not provided
            email_val = (data.get('email') or request.user.email or None)
            obj = ContactMessage.objects.create(
                user=request.user,
                email=email_val,
                subject=(data.get('subject') or ''),
                message=(data.get('message') or ''),
            )
            # Notify admins by email (best-effort)
            try:
                admin_emails = []
                admin_email = getattr(settings, 'ADMIN_EMAIL', None)
                if admin_email:
                    admin_emails.append(admin_email)
                # fall back to ADMINS config
                if hasattr(settings, 'ADMINS') and settings.ADMINS:
                    for a in settings.ADMINS:
                        if len(a) > 1 and a[1] not in admin_emails:
                            admin_emails.append(a[1])
                # fallback to DEFAULT_FROM_EMAIL if nothing else
                if not admin_emails and getattr(settings, 'DEFAULT_FROM_EMAIL', None):
                    admin_emails = [settings.DEFAULT_FROM_EMAIL]

                if admin_emails:
                    subject_line = f"New contact message: {obj.subject or 'No subject'}"
                    body = f"From: {obj.email or obj.user}\n\n{obj.message}\n\nView in admin: /admin/base/contactmessage/{obj._id}/"
                    try:
                        send_mail(subject_line, body, settings.DEFAULT_FROM_EMAIL, admin_emails, fail_silently=True)
                    except Exception:
                        pass
            except Exception:
                pass

            # Serialize for response
            return Response(ContactMessageSerializer(obj).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            # Fallback: try serializer-based flow to surface validation errors
            try:
                serializer = ContactMessageSerializer(data={
                    'user': request.user.pk,
                    'email': data.get('email') or request.user.email,
                    'subject': data.get('subject'),
                    'message': data.get('message'),
                })
                if serializer.is_valid():
                    obj = serializer.save()
                    # Notify admins by email (best-effort)
                    try:
                        admin_emails = []
                        admin_email = getattr(settings, 'ADMIN_EMAIL', None)
                        if admin_email:
                            admin_emails.append(admin_email)
                        if hasattr(settings, 'ADMINS') and settings.ADMINS:
                            for a in settings.ADMINS:
                                if len(a) > 1 and a[1] not in admin_emails:
                                    admin_emails.append(a[1])
                        if not admin_emails and getattr(settings, 'DEFAULT_FROM_EMAIL', None):
                            admin_emails = [settings.DEFAULT_FROM_EMAIL]
                        if admin_emails:
                            subject_line = f"New contact message: {obj.subject or 'No subject'}"
                            body = f"From: {obj.email or obj.user}\n\n{obj.message}\n\nView in admin: /admin/base/contactmessage/{obj._id}/"
                            try:
                                send_mail(subject_line, body, settings.DEFAULT_FROM_EMAIL, admin_emails, fail_silently=True)
                            except Exception:
                                pass
                    except Exception:
                        pass
                    return Response(ContactMessageSerializer(obj).data, status=status.HTTP_201_CREATED)
                return Response({'detail': 'Invalid data', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e2:
                traceback.print_exc()
                return Response({'detail': 'Server error saving message', 'error': str(e2)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # GET - admin list
    if not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    msgs = None
    query = request.query_params.get('q') or request.GET.get('q')
    from .models import ContactMessage
    msgs = ContactMessage.objects.all().order_by('-created_at')
    if query:
        msgs = msgs.filter(message__icontains=query) | msgs.filter(email__icontains=query) | msgs.filter(subject__icontains=query)
    page = request.query_params.get('page') or request.GET.get('page') or 1
    page_size = request.query_params.get('page_size') or request.GET.get('page_size') or 20
    paginator = Paginator(msgs, page_size)
    try:
        msgs_page = paginator.page(page)
    except PageNotAnInteger:
        msgs_page = paginator.page(1)
    except EmptyPage:
        msgs_page = []

    serializer = ContactMessageSerializer(msgs_page, many=True)
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': int(page),
    })


@api_view(['GET','PATCH'])
@permission_classes([IsAdminUser])
def contactMessageDetail(request, pk):
    from .models import ContactMessage
    try:
        msg = ContactMessage.objects.get(_id=pk)
    except ContactMessage.DoesNotExist:
        return Response({'detail': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ContactMessageSerializer(msg, many=False)
        return Response(serializer.data)

    if request.method == 'PATCH':
        data = request.data
        # allow marking read and admin reply
        if 'is_read' in data:
            msg.is_read = bool(data.get('is_read'))
        if 'admin_reply' in data:
            msg.admin_reply = data.get('admin_reply')
        msg.save()
        serializer = ContactMessageSerializer(msg, many=False)
        return Response(serializer.data)


@api_view(['GET','PUT','DELETE'])
@permission_classes([IsAdminUser])
def userDetail(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserSerializer(user, many=False)
        return Response(serializer.data)

    if request.method == 'PUT':
        data = request.data
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.first_name = data.get('name', user.first_name)
        user.is_staff = data.get('isAdmin', user.is_staff)
        if data.get('password'):
            user.set_password(data.get('password'))
        user.save()
        serializer = UserSerializer(user, many=False)
        return Response(serializer.data)

    if request.method == 'DELETE':
        user.delete()
        return Response({'detail': 'User deleted'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def getOrders(request):
    if request.method == 'POST':
        # Create a new order (authenticated user)
        data = request.data
        user = request.user
        
        try:
            # Create Order
            order = Order.objects.create(
                user=user,
                paymentMethod=data.get('paymentMethod'),
                taxPrice=data.get('taxPrice', 0),
                shippingPrice=data.get('shippingPrice', 0),
                totalPrice=data.get('totalPrice', 0),
            )
            
            # Create Order Items and Shipping Address
            orderItems = data.get('orderItems', [])
            if len(orderItems) == 0:
                order.delete()
                return Response({'detail': 'No order items'}, status=status.HTTP_400_BAD_REQUEST)
            
            for item in orderItems:
                product = Product.objects.get(_id=item.get('product'))
                orderItem = OrderItem.objects.create(
                    product=product,
                    order=order,
                    name=product.name,
                    qty=item.get('qty'),
                    price=item.get('price'),
                    image=product.image.url if product.image else '',
                )
            
            # Create Shipping Address
            shipping = data.get('shippingAddress', {})
            ShippingAddress.objects.create(
                order=order,
                address=shipping.get('address'),
                city=shipping.get('city'),
                postalCode=shipping.get('postalCode'),
                country=shipping.get('country'),
            )
            
            # Send order confirmation email
            try:
                send_order_confirmation_email(order, user)
            except Exception as e:
                # Log the error but don't fail the order creation
                print(f"Error sending order confirmation email: {e}")
            
            serializer = OrderSerializer(order, many=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    # GET: List all orders (admin only)
    if request.method == 'GET':
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        orders = Order.objects.all().order_by('-created_at')
        query = request.query_params.get('search') or request.query_params.get('q') or request.GET.get('q')
        if query:
            from django.db.models import Q
            orders = orders.filter(Q(user__username__icontains=query) | Q(user__email__icontains=query) | Q(_id__icontains=query))
        
        # Filter by payment status if provided
        paid_filter = request.query_params.get('paid')
        if paid_filter:
            orders = orders.filter(isPaid=(paid_filter.lower() == 'true'))

        page = request.query_params.get('page') or request.GET.get('page') or 1
        page_size = request.query_params.get('page_size') or request.GET.get('page_size') or 10
        paginator = Paginator(orders, page_size)
        try:
            orders_page = paginator.page(page)
        except PageNotAnInteger:
            orders_page = paginator.page(1)
        except EmptyPage:
            orders_page = []

        serializer = OrderSerializer(orders_page, many=True)
        return Response({
            'results': serializer.data,
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': int(page),
        })


@api_view(['GET','PUT','PATCH','DELETE'])
@permission_classes([IsAuthenticated])
def orderDetail(request, pk):
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    # Allow GET if user is owner or admin
    if request.method == 'GET':
        if order.user != request.user and not request.user.is_staff:
            return Response({'detail': 'Not authorized to view this order'}, status=status.HTTP_403_FORBIDDEN)
        serializer = OrderSerializer(order, many=False)
        return Response(serializer.data)

    if request.method in ['PUT', 'PATCH']:
        # Only admins can update order
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized to update orders'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data
        order.isPaid = data.get('isPaid', order.isPaid)
        order.isDelivered = data.get('isDelivered', order.isDelivered)
        if 'isRefunded' in data:
            order.isRefunded = data.get('isRefunded')
        order.save()
        serializer = OrderSerializer(order, many=False)
        return Response(serializer.data)

    if request.method == 'DELETE':
        # Only admins can delete orders
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized to delete orders'}, status=status.HTTP_403_FORBIDDEN)
        order.delete()
        return Response({'detail': 'Order deleted'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateOrderPayment(request, pk):
    """Update order payment status after successful payment processing"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only the order's user or admin can update payment
    if order.user != request.user and not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data
    order.isPaid = True
    order.paymentResult = data
    from django.utils import timezone
    order.paidAt = timezone.now()
    order.save()
    
    # Send payment confirmation email
    try:
        payment_method = order.paymentMethod or "Payment"
        send_payment_confirmation_email(order, order.user, payment_method)
    except Exception as e:
        # Log the error but don't fail the payment update
        print(f"Error sending payment confirmation email: {e}")
    
    serializer = OrderSerializer(order, many=False)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def myOrders(request):
    """Return orders for the authenticated user"""
    user = request.user
    orders = Order.objects.filter(user=user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmTransferPayment(request, pk):
    """Confirm transfer payment - user indicates they've made the transfer"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only the order's user can confirm their own transfer
    if order.user != request.user:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    # Verify order is using Transfer payment method
    if order.paymentMethod != 'Transfer':
        return Response(
            {'detail': 'This order does not use Transfer payment method'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark transfer as awaiting confirmation from admin
    order.transferConfirmed = False  # Initially waiting for admin verification
    from django.utils import timezone
    order.transferConfirmedAt = timezone.now()
    order.save()
    
    serializer = OrderSerializer(order, many=False)
    return Response({
        'detail': 'Transfer confirmed. Awaiting admin verification.',
        'order': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approveTransferPayment(request, pk):
    """Admin endpoint to approve transfer payment"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Verify order is using Transfer payment method
    if order.paymentMethod != 'Transfer':
        return Response(
            {'detail': 'This order does not use Transfer payment method'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Only approve if user indicated transfer was made
    if not order.transferConfirmedAt:
        return Response(
            {'detail': 'User has not confirmed the transfer yet'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark order as paid
    from django.utils import timezone
    order.isPaid = True
    order.paidAt = timezone.now()
    order.transferConfirmed = True
    order.paymentResult = {'transferApprovedBy': request.user.username, 'method': 'Transfer'}
    order.save()
    
    serializer = OrderSerializer(order, many=False)
    return Response({
        'detail': 'Transfer payment approved. Order marked as paid.',
        'order': serializer.data
    })

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manageWishlist(request):
    """Get, add, or remove products from user's wishlist"""
    user = request.user
    try:
        wishlist = Wishlist.objects.get(user=user)
    except Wishlist.DoesNotExist:
        wishlist = Wishlist.objects.create(user=user)
    
    if request.method == 'GET':
        # Get wishlist items
        products = wishlist.products.all()
        serializer = ProductSerializer(products, many=True)
        return Response({
            'count': products.count(),
            'items': serializer.data
        })
    
    elif request.method == 'POST':
        # Add product to wishlist
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(_id=product_id)
            wishlist.products.add(product)
            wishlist.save()
            return Response({
                'detail': f'{product.name} added to wishlist',
                'product_id': product_id
            }, status=status.HTTP_201_CREATED)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    elif request.method == 'DELETE':
        # Remove product from wishlist
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(_id=product_id)
            wishlist.products.remove(product)
            wishlist.save()
            return Response({
                'detail': f'{product.name} removed from wishlist',
                'product_id': product_id
            })
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkWishlistItem(request, product_id):
    """Check if a product is in user's wishlist"""
    user = request.user
    try:
        wishlist = Wishlist.objects.get(user=user)
        is_in_wishlist = wishlist.products.filter(_id=product_id).exists()
        return Response({'in_wishlist': is_in_wishlist})
    except Wishlist.DoesNotExist:
        return Response({'in_wishlist': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refundOrder(request, pk):
    """Request or process refund for an order"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only order owner or admin can refund
    if order.user != request.user and not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    # Check if order is paid
    if not order.isPaid:
        return Response(
            {'detail': 'Cannot refund unpaid order'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if already refunded
    if order.isRefunded:
        return Response(
            {'detail': 'Order already refunded'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    reason = request.data.get('reason', 'Refund requested')
    
    # Mark as refunded
    from django.utils import timezone
    order.isRefunded = True
    order.save()
    
    # Send refund notification email
    try:
        from django.core.mail import send_mail
        subject = f"Refund Processed - Order #{order._id}"
        message = f"""
        Hello {order.user.first_name or order.user.username},
        
        Your refund request for order #{order._id} has been processed.
        Amount: ${order.totalPrice:.2f}
        Reason: {reason}
        
        The refund should appear in your account within 5-10 business days.
        
        Thank you for shopping with mamigloexclusive!
        """
        send_mail(
            subject,
            message,
            'from@mamigloexclusive.com',
            [order.user.email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Error sending refund email: {e}")
    
    serializer = OrderSerializer(order, many=False)
    return Response({
        'detail': 'Refund processed successfully',
        'order': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOrderInvoice(request, pk):
    """Generate and return order invoice as HTML"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only order owner or admin can view invoice
    if order.user != request.user and not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        invoice_html = generate_invoice_html(order)
        filename = generate_invoice_filename(order)
        return Response({
            'invoice_html': invoice_html,
            'filename': filename,
            'order_id': order._id
        })
    except Exception as e:
        return Response(
            {'detail': f'Error generating invoice: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOrderInvoicePDF(request, pk):
    """Generate and download order invoice as PDF"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only order owner or admin can download invoice
    if order.user != request.user and not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        invoice_html = generate_invoice_html(order)
        pdf_buffer = generate_pdf_from_html(invoice_html, None)
        
        if pdf_buffer is None:
            # Return HTML version if PDF generation fails
            return JsonResponse({
                'message': 'PDF library not installed. Please install xhtml2pdf: pip install xhtml2pdf',
                'invoice_html': invoice_html,
                'fallback': True
            })
        
        filename = f"{generate_invoice_filename(order)}.pdf"
        response = FileResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        return Response(
            {'detail': f'Error generating PDF: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateOrderTracking(request, pk):
    """Update order tracking information (admin only)"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only admin can update tracking
    if not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data
    
    # Update order status
    if 'status' in data:
        order.status = data['status']
    
    # Update tracking number
    if 'tracking_number' in data:
        order.tracking_number = data['tracking_number']
    
    # Update estimated delivery
    if 'estimated_delivery' in data:
        order.estimated_delivery = data['estimated_delivery']
    
    # Mark as delivered if status is 'delivered'
    if data.get('status') == 'delivered':
        from django.utils import timezone
        order.isDelivered = True
        order.deliveredAt = timezone.now()
        # Send shipment email
        try:
            send_order_shipped_email(order, order.user, order.tracking_number)
        except Exception as e:
            print(f"Error sending shipment email: {e}")
    
    order.save()
    
    serializer = OrderSerializer(order, many=False)
    return Response({
        'detail': 'Order tracking updated',
        'order': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOrderTracking(request, pk):
    """Get order tracking information"""
    try:
        order = Order.objects.get(_id=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only order owner or admin can view tracking
    if order.user != request.user and not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'order_id': order._id,
        'status': order.status,
        'tracking_number': order.tracking_number,
        'estimated_delivery': order.estimated_delivery,
        'is_delivered': order.isDelivered,
        'delivered_at': order.deliveredAt,
        'created_at': order.created_at,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getAnalytics(request):
    """Get comprehensive analytics for admin dashboard"""
    if not request.user.is_staff:
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count, Sum, Avg, Q
    from datetime import timedelta
    from django.utils import timezone
    
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # Total metrics
    total_orders = Order.objects.count()
    total_revenue = Order.objects.filter(isPaid=True).aggregate(Sum('totalPrice'))['totalPrice__sum'] or 0
    total_products = Product.objects.count()
    total_users = User.objects.count()
    
    # Orders by status
    orders_by_status = Order.objects.values('status').annotate(count=Count('_id'))
    
    # Payment methods breakdown
    payment_methods = Order.objects.values('paymentMethod').annotate(
        count=Count('_id'),
        total=Sum('totalPrice')
    ).filter(paymentMethod__isnull=False)
    
    # Top products
    top_products = OrderItem.objects.values('name', 'product').annotate(
        total_qty=Sum('qty'),
        total_revenue=Sum(('price', 'qty'))
    ).order_by('-total_qty')[:10]
    
    # Recent orders
    recent_orders = Order.objects.order_by('-created_at')[:5]
    recent_orders_serialized = OrderSerializer(recent_orders, many=True).data
    
    # Revenue this month
    monthly_revenue = Order.objects.filter(
        created_at__gte=thirty_days_ago,
        isPaid=True
    ).aggregate(Sum('totalPrice'))['totalPrice__sum'] or 0
    
    # Customer growth (unique customers this month)
    new_customers = User.objects.filter(
        date_joined__gte=thirty_days_ago
    ).count()
    
    # Refund requests
    refund_requests = Order.objects.filter(isRefunded=True).count()
    pending_transfers = Order.objects.filter(
        paymentMethod='Transfer',
        transferConfirmed=False,
        isPaid=False
    ).count()
    
    return Response({
        'summary': {
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'total_products': total_products,
            'total_users': total_users,
            'monthly_revenue': float(monthly_revenue),
            'new_customers_30d': new_customers,
            'refund_requests': refund_requests,
            'pending_transfers': pending_transfers,
        },
        'orders_by_status': list(orders_by_status),
        'payment_methods': list(payment_methods),
        'top_products': list(top_products),
        'recent_orders': recent_orders_serialized,
    })

