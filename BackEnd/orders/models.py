from django.db import models
from users_app.models import CustomUser
from products.models import Product

# Create your models here.
class Cart(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=10, null=True, blank=True) 

    def __str__(self):
        return f"{self.product.title} - {self.size} ({self.quantity})"
    

class Wishlist(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, related_name='wishlists', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wishlist of {self.user.username}"
    
class OrderAddress(models.Model):
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    pincode = models.CharField(max_length=10)
    address = models.TextField()
    landmark = models.CharField(max_length=100, null=True, blank=True)
    
    def __str__(self):
        return f"Address for {self.name}"
    

class Order(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='orders')
    
    delivery_address = models.OneToOneField(OrderAddress, on_delete=models.CASCADE, related_name='order')
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(
        max_length=20, 
        choices=[('Pending', 'Pending'), ('Success', 'Success'), ('Failed', 'Failed')],
        default='Pending'
    )
    STATUS_CHOICES = [
        ('Order Placed', 'Order Placed'),
        ('Shipped', 'Shipped'),
        ('Out for Delivery', 'Out for Delivery'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled')
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Order Placed')

    provider_order_id = models.CharField(max_length=100, verbose_name="Razorpay Order ID")
    payment_id = models.CharField(max_length=100, verbose_name="Razorpay Payment ID", null=True, blank=True)
    signature_id = models.CharField(max_length=100, verbose_name="Signature ID", null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.user.username}"
    
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=10, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2) 

    def __str__(self):
        return f"{self.product.title} - {self.quantity}"