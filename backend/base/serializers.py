from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Review, Order, OrderItem, ShippingAddress


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    orderitems = OrderItemSerializer(many=True, read_only=True)
    shippingaddress = ShippingAddressSerializer(read_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Order
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    isAdmin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'isAdmin')
    
    def get_isAdmin(self, obj):
        return obj.is_staff


class UserSerializerWithToken(serializers.ModelSerializer):
    token = serializers.SerializerMethodField(read_only=True)
    name = serializers.SerializerMethodField(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'name', 'isAdmin', 'token')

    def get_token(self, obj):
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(obj)
        return str(token.access_token)

    def get_name(self, obj):
        name = obj.first_name
        if name == '':
            name = obj.username
        return name

    def get_isAdmin(self, obj):
        return obj.is_staff


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = None
        try:
            from .models import ContactMessage
            model = ContactMessage
        except Exception:
            model = None
        fields = '__all__'
