from django.urls import path
from .views import (
    AdminReviewDetailView,
    AdminReviewListCreateView,
    ProductDetailView,
    ProductListCreateView,
    ProductReviewListCreateView,
    ProductStockView,
)

urlpatterns = [
    path('',ProductListCreateView.as_view(),name='product_list_create'),
    path('reviews/admin/', AdminReviewListCreateView.as_view(), name='admin-review-list-create'),
    path('reviews/<int:review_id>/', AdminReviewDetailView.as_view(), name='admin-review-detail'),
    path('<int:id>/', ProductDetailView.as_view(), name='product-detail'),
    path('<int:id>/reviews/', ProductReviewListCreateView.as_view(), name='product-reviews'),
    path('<int:id>/stock/', ProductStockView.as_view(), name='product-stock'),
]
