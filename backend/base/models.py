from django.db import models
from django.contrib.auth.models import User

class Product(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200 , null=True, blank=True)
    image = models.ImageField(null=True, blank=True, default='/placeholder.png')
    brand = models.CharField(max_length=200 , null=True, blank=True)
    category = models.CharField(max_length=200 , null=True, blank=True)
    description = models.TextField( null=True, blank=True)
    rating = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    numReviews = models.IntegerField( default=0, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2 , null=True, blank=True, default=0)
    priceCurrency = models.CharField(max_length=10, default='USD', choices=[
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('GBP', 'British Pound'),
        ('JPY', 'Japanese Yen'),
        ('AUD', 'Australian Dollar'),
        ('CAD', 'Canadian Dollar'),
        ('CHF', 'Swiss Franc'),
        ('CNY', 'Chinese Yuan'),
        ('INR', 'Indian Rupee'),
        ('NGN', 'Nigerian Naira'),
        ('KES', 'Kenyan Shilling'),
        ('GHS', 'Ghanaian Cedi'),
        ('EGP', 'Egyptian Pound'),
        ('ZAR', 'South African Rand'),
        ('BRL', 'Brazilian Real'),
        ('MXN', 'Mexican Peso'),
    ])
    countInStock = models.IntegerField(  default=0, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True)
    
    def __str__(self):
        return self.name

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    email = models.EmailField(max_length=200, null=True, blank=True)
    rating = models.IntegerField(default=0)
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True)
    
    def __str__(self):
        return str(self.rating)
    
class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    paymentMethod = models.CharField(max_length=200, null=True, blank=True)
    taxPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shippingPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    totalPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    isPaid = models.BooleanField(default=False)
    paidAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    paymentResult = models.JSONField(null=True, blank=True, default=dict)  # Store PayPal transaction details
    isDelivered = models.BooleanField(default=False)
    deliveredAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    isRefunded = models.BooleanField(default=False)
    # Transfer payment fields
    transferConfirmed = models.BooleanField(default=False)  # Admin confirmation for bank transfer
    transferConfirmedAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    # Order tracking status
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    tracking_number = models.CharField(max_length=100, null=True, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True)

    def __str__(self):
        return str(self.created_at)


class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='orderitems')
    name = models.CharField(max_length=200, null=True, blank=True)
    qty = models.IntegerField(default=0, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.CharField(max_length=500, null=True, blank=True)
    _id = models.AutoField(primary_key=True)

    def __str__(self):
        return str(self.name)


class ShippingAddress(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shippingaddress')
    address = models.CharField(max_length=200, null=True, blank=True)
    city = models.CharField(max_length=200, null=True, blank=True)
    postalCode = models.CharField(max_length=200, null=True, blank=True)
    country = models.CharField(max_length=200, null=True, blank=True)
    shippingPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    _id = models.AutoField(primary_key=True)

    def __str__(self):
        return str(self.address)


class ContactMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    email = models.EmailField(max_length=200, null=True, blank=True)
    subject = models.CharField(max_length=255, null=True, blank=True)
    message = models.TextField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    admin_reply = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True)

    def __str__(self):
        return f"Message from {self.email or self.user or 'anonymous'}"


class Wishlist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, related_name='in_wishlists')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    _id = models.AutoField(primary_key=True)

    def __str__(self):
        return f"Wishlist for {self.user.username}"
