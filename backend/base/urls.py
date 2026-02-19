from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('users/register/', views.registerUser, name='user-register'),
    path('users/login/', views.loginUser, name='user-login'),
    path('users/profile/', views.getUserProfile, name='user-profile'),
    path('users/password-reset/', views.passwordResetRequest, name='password-reset'),
    path('users/password-reset-confirm/', views.passwordResetConfirm, name='password-reset-confirm'),
    path('users/', views.getUsers, name='users'),
    path('users/<int:pk>/', views.userDetail, name='user-detail'),
    path('orders/', views.getOrders, name='orders'),
    path('orders/my-orders/', views.myOrders, name='my-orders'),
    path('orders/<int:pk>/', views.orderDetail, name='order-detail'),
    path('orders/<int:pk>/pay/', views.updateOrderPayment, name='order-pay'),
    path('orders/<int:pk>/refund/', views.refundOrder, name='order-refund'),
    path('orders/<int:pk>/invoice/', views.getOrderInvoice, name='order-invoice'),
    path('orders/<int:pk>/invoice/pdf/', views.getOrderInvoicePDF, name='order-invoice-pdf'),
    path('orders/<int:pk>/tracking/', views.getOrderTracking, name='order-tracking'),
    path('orders/<int:pk>/update-tracking/', views.updateOrderTracking, name='update-tracking'),
    path('orders/<int:pk>/confirm-transfer/', views.confirmTransferPayment, name='confirm-transfer'),
    path('orders/<int:pk>/approve-transfer/', views.approveTransferPayment, name='approve-transfer'),
    path('messages/', views.contactMessages, name='contact-messages'),
    path('messages/<int:pk>/', views.contactMessageDetail, name='contact-message-detail'),
    path('products/create/', views.createProduct, name='product-create'),
    path('products/', views.getProducts, name='products'),
    path('products/<str:pk>/', views.productDetail, name='product'),
    path('wishlist/', views.manageWishlist, name='wishlist'),
    path('wishlist/<int:product_id>/', views.checkWishlistItem, name='check-wishlist'),
    path('analytics/', views.getAnalytics, name='analytics'),
    path('token/refresh/', views.MyTokenRefreshView.as_view(), name='token_refresh'),
    path('', views.getRoutes, name="routes"),
]   