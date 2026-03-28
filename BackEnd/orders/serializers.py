from rest_framework import serializers
from .models import Cart, CartItem,Wishlist,Order,OrderItem,OrderAddress
from products.models import Product, ProductSize
from products.serializers import ProductSerializer
from .pricing import calculate_cart_totals, get_cart_item_pricing

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    max_stock = serializers.SerializerMethodField()
    original_unit_price = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    original_line_total = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()
    bulk_discount_total = serializers.SerializerMethodField()
    bulk_applied = serializers.SerializerMethodField()
    bulk_label = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product',
            'product_id',
            'quantity',
            'size',
            'max_stock',
            'original_unit_price',
            'unit_price',
            'original_line_total',
            'line_total',
            'bulk_discount_total',
            'bulk_applied',
            'bulk_label',
        ]

    def _get_pricing(self, obj):
        if not hasattr(self, '_pricing_cache'):
            self._pricing_cache = {}
        if obj.id not in self._pricing_cache:
            self._pricing_cache[obj.id] = get_cart_item_pricing(obj)
        return self._pricing_cache[obj.id]

    def get_max_stock(self, obj):
        if obj.size:
            try:
                size_obj = ProductSize.objects.get(product=obj.product, size=obj.size)
                return size_obj.stock
            except ProductSize.DoesNotExist:
                return 0
        return 0

    def get_original_unit_price(self, obj):
        return f"{self._get_pricing(obj)['original_unit_price']:.2f}"

    def get_unit_price(self, obj):
        return f"{self._get_pricing(obj)['unit_price']:.2f}"

    def get_original_line_total(self, obj):
        return f"{self._get_pricing(obj)['original_line_total']:.2f}"

    def get_line_total(self, obj):
        return f"{self._get_pricing(obj)['line_total']:.2f}"

    def get_bulk_discount_total(self, obj):
        return f"{self._get_pricing(obj)['bulk_discount_total']:.2f}"

    def get_bulk_applied(self, obj):
        return self._get_pricing(obj)['bulk_applied']

    def get_bulk_label(self, obj):
        return self._get_pricing(obj)['bulk_label']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        totals = calculate_cart_totals(instance.items.select_related('product').all())
        data.update({key: f'{value:.2f}' for key, value in totals.items()})
        return data

class WishlistSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'products']


class OrderAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAddress
        fields = ['name', 'mobile', 'pincode', 'address', 'landmark']

class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.URLField(source='product.image', read_only=True, allow_null=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['product_id', 'product_title', 'product_image', 'quantity', 'size', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True) 
    delivery_address = OrderAddressSerializer(read_only=True) 
    orderDate = serializers.DateTimeField(source='created_at', format="%Y-%m-%d")

    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_amount', 'payment_status', 'status', 'provider_order_id', 'delivery_address', 'items', 'orderDate']

    def get_payment_status(self, obj):
        if obj.payment_status == 'Pending':
            return "COD"
        else:
            return "Paid Online"

class AdminOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True) 
    delivery_address = OrderAddressSerializer(read_only=True)
    orderDate = serializers.DateTimeField(source='created_at', format="%Y-%m-%d")
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'username', 'status', 'total_amount', 'orderDate', 
            'delivery_address', 'items'
        ]
