from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from users_app.models import CustomUser

# Create your models here.
class Product(models.Model):
    PRODUCT_CATEGORY_CHOICES = [
        ('T-Shirts', 'T-Shirts'),
        ('Shirts', 'Shirts'),
        ('Polos', 'Polos'),
        ('Hoodies', 'Hoodies'),
        ('Jackets', 'Jackets'),
        ('Joggers', 'Joggers'),
        ('Shorts', 'Shorts'),
        ('Co-ords', 'Co-ords'),
        ('Basics', 'Basics'),
    ]
    FIT_CHOICES = [
        ('Regular', 'Regular'),
        ('Oversized', 'Oversized'),
        ('Relaxed', 'Relaxed'),
        ('Slim', 'Slim'),
    ]
    STYLE_CHOICES = [
        ('Minimal', 'Minimal'),
        ('Graphic', 'Graphic'),
        ('Streetwear', 'Streetwear'),
        ('Basics', 'Basics'),
        ('Premium', 'Premium'),
        ('Printed', 'Printed'),
        ('Solid', 'Solid'),
    ]

    title = models.CharField(max_length=200)
    product_code = models.CharField(max_length=50, help_text="Common code for same products with different colors")

    category = models.CharField(max_length=30, choices=PRODUCT_CATEGORY_CHOICES, default='T-Shirts')
    fit = models.CharField(max_length=20, choices=FIT_CHOICES, default='Regular')
    style = models.CharField(max_length=30, choices=STYLE_CHOICES, default='Printed')
    color = models.CharField(max_length=50)
    brand = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bulk_order_min_qty = models.PositiveIntegerField(null=True, blank=True)
    bulk_order_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.URLField(max_length=1000, blank=True, null=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.color})"

    def has_bulk_offer(self):
        return bool(
            self.bulk_order_min_qty
            and self.bulk_order_min_qty > 1
            and self.bulk_order_price is not None
            and Decimal(self.bulk_order_price) < Decimal(self.price)
        )

    def get_unit_price_for_quantity(self, quantity):
        if self.has_bulk_offer() and quantity >= self.bulk_order_min_qty:
            return self.bulk_order_price
        return self.price

class ProductSize(models.Model):
    product = models.ForeignKey(Product, related_name='sizes', on_delete=models.CASCADE)
    SIZE_CHOICES = [
        ('S', 'S'),
        ('M', 'M'),
        ('L', 'L'),
        ('XL', 'XL'),
        ('XXL', 'XXL'),
    ]
    size = models.CharField(max_length=5, choices=SIZE_CHOICES)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.product.title} - {self.size} ({self.stock})"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='extra_images', on_delete=models.CASCADE)
    image = models.URLField(max_length=1000, blank=True, null=True)

    def __str__(self):
        return f"Image for {self.product.title}"


class ProductReview(models.Model):
    STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('hidden', 'Hidden'),
    ]

    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, related_name='product_reviews', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=120, blank=True)
    comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['product', 'user'], name='unique_product_review_per_user'),
        ]

    def __str__(self):
        return f"{self.product.title} review by {self.user.username}"


class ProductReviewImage(models.Model):
    review = models.ForeignKey(ProductReview, related_name='images', on_delete=models.CASCADE)
    image = models.URLField(max_length=1000, blank=True, null=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"Image for review #{self.review_id}"
