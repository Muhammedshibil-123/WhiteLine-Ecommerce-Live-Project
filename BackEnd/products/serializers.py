from django.db.models import Avg, Count
from rest_framework import serializers

from orders.models import OrderItem
from .models import Product, ProductSize, ProductImage, ProductReview

class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['id', 'size', 'stock']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)

    class Meta:
        model = ProductReview
        fields = ['id', 'user_name', 'rating', 'title', 'comment', 'status', 'created_at']


class ProductReviewWriteSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=120, allow_blank=True, required=False)
    comment = serializers.CharField(allow_blank=True, required=False)


class AdminProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            'id',
            'product',
            'product_title',
            'user',
            'user_name',
            'rating',
            'title',
            'comment',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'product_title', 'user_name', 'created_at']


class AdminProductReviewWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=120, allow_blank=True, required=False)
    comment = serializers.CharField(allow_blank=True, required=False)
    status = serializers.ChoiceField(choices=ProductReview.STATUS_CHOICES, required=False)


class ProductListSerializer(serializers.ModelSerializer):
    sizes = ProductSizeSerializer(many=True, read_only=True)
    extra_images = ProductImageSerializer(many=True, read_only=True)
    available_colors = serializers.SerializerMethodField()
    rating_average = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_available_colors(self, obj):
        variants = Product.objects.filter(product_code=obj.product_code,status='active').exclude(id=obj.id)
        return [
            {
                "id": v.id, 
                "color": v.color, 
                "image": v.image if v.image else None 
            } 
            for v in variants
        ]

    def get_rating_average(self, obj):
        rating_value = getattr(obj, 'approved_rating_average', None)
        if rating_value is None:
            rating_value = obj.reviews.filter(status='approved').aggregate(avg=Avg('rating'))['avg']
        return round(float(rating_value or 0), 1)

    def get_rating_count(self, obj):
        rating_count = getattr(obj, 'approved_rating_count', None)
        if rating_count is None:
            rating_count = obj.reviews.filter(status='approved').aggregate(count=Count('id'))['count']
        return int(rating_count or 0)


class ProductDetailSerializer(ProductListSerializer):
    reviews = serializers.SerializerMethodField()
    user_review = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = '__all__'

    def get_reviews(self, obj):
        reviews = obj.reviews.filter(status='approved').select_related('user')
        return ProductReviewSerializer(reviews, many=True).data

    def get_user_review(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        review = obj.reviews.filter(user=request.user).select_related('user').first()
        return ProductReviewSerializer(review).data if review else None

    def get_can_review(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        return OrderItem.objects.filter(
            order__user=request.user,
            order__status='Delivered',
            product=obj,
        ).exists()


# Backward-compatible alias for existing imports in carts, wishlists, and orders.
ProductSerializer = ProductListSerializer
