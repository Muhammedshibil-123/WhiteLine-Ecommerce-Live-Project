from django.db import transaction
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics,status, permissions
from rest_framework.views import APIView
from .models import Product,ProductSize,ProductImage,ProductReview
from .serializers import (
    AdminProductReviewSerializer,
    AdminProductReviewWriteSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductReviewSerializer,
    ProductReviewWriteSerializer,
    ProductSizeSerializer,
)
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from .imgbb import ImgBBUploadError, upload_uploaded_file
from users_app.models import CustomUser
from orders.models import OrderItem


def get_product_queryset():
    return Product.objects.all().prefetch_related(
        'sizes',
        'extra_images',
        'reviews__user',
    ).annotate(
        approved_rating_average=Avg('reviews__rating', filter=Q(reviews__status='approved')),
        approved_rating_count=Count('reviews', filter=Q(reviews__status='approved')),
    )


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

# Create your views here.
class ProductImageUploadMixin:
    upload_fields = ('image', 'gallery')

    def _get_serializer_data(self, request):
        data = request.data.copy()

        for field_name in self.upload_fields:
            data.pop(field_name, None)

        return data

    def _save_remote_images(self, product):
        main_image = self.request.FILES.get('image')
        if main_image:
            product.image = upload_uploaded_file(main_image)
            product.save(update_fields=['image'])

        gallery_images = self.request.FILES.getlist('gallery')
        for img in gallery_images:
            ProductImage.objects.create(
                product=product,
                image=upload_uploaded_file(img),
            )


class ProductListCreateView(ProductImageUploadMixin, generics.ListCreateAPIView):
    permission_classes = [AllowAny]

    def get_queryset(self):
        return get_product_queryset()

    def get_serializer_class(self):
        return ProductListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=self._get_serializer_data(request))
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                product = serializer.save()
                self._save_remote_images(product)
        except ImgBBUploadError as exc:
            raise ValidationError({'image': [str(exc)]})

        response_serializer = self.get_serializer(product)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ProductDetailView(ProductImageUploadMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        return get_product_queryset()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductDetailSerializer
        return ProductListSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=self._get_serializer_data(request),
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                product = serializer.save()
                self._save_remote_images(product)
        except ImgBBUploadError as exc:
            raise ValidationError({'image': [str(exc)]})

        return Response(self.get_serializer(product).data)


class ProductStockView(APIView):
    def get(self, request, id):
        try:
            product = Product.objects.get(id=id)
            sizes = product.sizes.all()
            serializer = ProductSizeSerializer(sizes, many=True)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, id):
        try:
            product = Product.objects.get(id=id)
            data = request.data 
            
            for item in data:
                size_code = item.get('size')
                stock_count = item.get('stock')
                if size_code:
                    ProductSize.objects.update_or_create(
                        product=product,
                        size=size_code,
                        defaults={'stock': stock_count or 0}
                    )
            product_serializer = ProductListSerializer(product, context={'request': request})
            return Response(product_serializer.data, status=status.HTTP_200_OK)
            
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)


class ProductReviewListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id):
        product = get_object_or_404(get_product_queryset(), id=id)
        serializer = ProductDetailSerializer(product, context={'request': request})
        return Response(
            {
                'rating_average': serializer.data.get('rating_average', 0),
                'rating_count': serializer.data.get('rating_count', 0),
                'reviews': serializer.data.get('reviews', []),
                'user_review': serializer.data.get('user_review'),
                'can_review': serializer.data.get('can_review', False),
            }
        )

    def post(self, request, id):
        if not request.user or not request.user.is_authenticated:
            raise PermissionDenied('Login required to submit a review.')

        product = get_object_or_404(Product, id=id)
        serializer = ProductReviewWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        has_delivered_order = OrderItem.objects.filter(
            order__user=request.user,
            order__status='Delivered',
            product=product,
        ).exists()

        if not has_delivered_order:
            raise PermissionDenied('You can review a product only after a delivered order.')

        review, _ = ProductReview.objects.update_or_create(
            product=product,
            user=request.user,
            defaults={
                'rating': serializer.validated_data['rating'],
                'title': serializer.validated_data.get('title', ''),
                'comment': serializer.validated_data.get('comment', ''),
                'status': 'approved',
            },
        )

        refreshed_product = get_product_queryset().get(id=id)
        return Response(ProductDetailSerializer(refreshed_product, context={'request': request}).data)


class AdminReviewListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        reviews = ProductReview.objects.select_related('product', 'user').all()
        return Response(AdminProductReviewSerializer(reviews, many=True).data)

    def post(self, request):
        serializer = AdminProductReviewWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = get_object_or_404(Product, id=serializer.validated_data['product_id'])
        user = get_object_or_404(CustomUser, id=serializer.validated_data['user_id'])

        review, _ = ProductReview.objects.update_or_create(
            product=product,
            user=user,
            defaults={
                'rating': serializer.validated_data['rating'],
                'title': serializer.validated_data.get('title', ''),
                'comment': serializer.validated_data.get('comment', ''),
                'status': serializer.validated_data.get('status', 'approved'),
            },
        )

        return Response(AdminProductReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class AdminReviewDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, review_id):
        review = get_object_or_404(ProductReview.objects.select_related('product', 'user'), id=review_id)

        serializer = AdminProductReviewWriteSerializer(data={
            'product_id': review.product_id,
            'user_id': review.user_id,
            'rating': request.data.get('rating', review.rating),
            'title': request.data.get('title', review.title),
            'comment': request.data.get('comment', review.comment),
            'status': request.data.get('status', review.status),
        })
        serializer.is_valid(raise_exception=True)

        review.rating = serializer.validated_data['rating']
        review.title = serializer.validated_data.get('title', '')
        review.comment = serializer.validated_data.get('comment', '')
        review.status = serializer.validated_data.get('status', review.status)
        review.save()

        return Response(AdminProductReviewSerializer(review).data)

    def delete(self, request, review_id):
        review = get_object_or_404(ProductReview, id=review_id)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
