from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from .models import Cart, CartItem,Wishlist,Order,OrderItem,OrderAddress
from .serializers import CartSerializer, CartItemSerializer,WishlistSerializer,OrderSerializer,AdminOrderSerializer
from products.models import Product, ProductSize
from .pricing import calculate_cart_totals, get_cart_item_pricing
from django.conf import settings
from rest_framework.views import APIView
from django.db.models import Q

try:
    import razorpay
except ImportError:
    razorpay = None


def get_razorpay_client():
    if razorpay is None:
        raise RuntimeError("Razorpay SDK is not installed.")
    return razorpay.Client(auth=(settings.RAZOR_KEY_ID, settings.RAZOR_KEY_SECRET))

# Create your views here.
class CartView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart


class AddToCartView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        size = request.data.get('size') 
        
        if not product_id:
            return Response({"error": "Product ID required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        cart, created = Cart.objects.get_or_create(user=request.user)

        product_size = None
        if size:
            try:
                product_size = ProductSize.objects.get(product=product, size=size)
            except ProductSize.DoesNotExist:
                return Response({"error": "Invalid size"}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart, 
            product=product, 
            size=size, 
            defaults={'quantity': 1}
        )

        if item_created and product_size and product_size.stock < 1:
            cart_item.delete()
            return Response({"error": "This size is out of stock"}, status=status.HTTP_400_BAD_REQUEST)

        if not item_created:
            if product_size and cart_item.quantity >= product_size.stock:
                return Response(
                    {"error": f"Only {product_size.stock} items available in this size"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity += 1
            cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateCartItemView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            cart_item = CartItem.objects.get(pk=pk, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        new_size = request.data.get('size')
        new_quantity = request.data.get('quantity')

        if new_size is not None:
            if new_size == "": 
                 cart_item.size = None
            else:
                try:
                    p_size = ProductSize.objects.get(product=cart_item.product, size=new_size)
                    if p_size.stock < cart_item.quantity:
                         return Response({"error": f"Only {p_size.stock} items available in {new_size}"}, status=status.HTTP_400_BAD_REQUEST)
                    cart_item.size = new_size
                except ProductSize.DoesNotExist:
                    return Response({"error": "Invalid size"}, status=status.HTTP_400_BAD_REQUEST)

        if new_quantity is not None:
            new_quantity = int(new_quantity)
            if new_quantity < 1:
                return Response({"error": "Quantity must be at least 1"}, status=status.HTTP_400_BAD_REQUEST)
            
            if cart_item.size:
                p_size = ProductSize.objects.get(product=cart_item.product, size=cart_item.size)
                if new_quantity > p_size.stock:
                    return Response({"error": f"Out of stock. Only {p_size.stock} available."}, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item.quantity = new_quantity

        cart_item.save()
        return Response(CartItemSerializer(cart_item).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            cart_item = CartItem.objects.get(pk=pk, cart__user=request.user)
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
        

class WishlistView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WishlistSerializer

    def get_object(self):
        wishlist, created = Wishlist.objects.get_or_create(user=self.request.user)
        return wishlist

class ToggleWishlistView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "Product ID required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        
        if wishlist.products.filter(id=product_id).exists():
            wishlist.products.remove(product)
            message = "Removed from wishlist"
            action = "removed"
        else:
            wishlist.products.add(product)
            message = "Added to wishlist"
            action = "added"
            
        return Response({"message": message, "action": action}, status=status.HTTP_200_OK)
    


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        address_data = request.data.get('delivery_address', {})
        payment_method = request.data.get('payment_method', 'online') 
        cart, created = Cart.objects.get_or_create(user=user)
        cart_items = list(cart.items.select_related('product').all())

        if not cart_items:
            return Response({"error": "Your cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        for item in cart_items:
            if item.product.sizes.exists() and not item.size:
                return Response(
                    {"error": f"Please select a size for {item.product.title} before checkout."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        totals = calculate_cart_totals(cart_items)
        amount = totals['grand_total']

        order_address = OrderAddress.objects.create(
            name=address_data.get('name'),
            mobile=address_data.get('mobile'),
            pincode=address_data.get('pincode'),
            address=address_data.get('address'),
            landmark=address_data.get('landmark', '')
        )

        if payment_method == 'cod':
            order = Order.objects.create(
                user=user,
                total_amount=amount,
                delivery_address=order_address,
                provider_order_id="COD", 
                payment_status='Pending',
                status='Order Placed'
            )

            for item in cart_items:
                item_pricing = get_cart_item_pricing(item)
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    size=item.size,
                    price=item_pricing['unit_price']
                )
               
                if item.size:
                    try:
                        p_size = ProductSize.objects.get(product=item.product, size=item.size)
                        if p_size.stock >= item.quantity:
                            p_size.stock -= item.quantity
                            p_size.save()
                    except ProductSize.DoesNotExist:
                        pass
            
            cart.items.all().delete()

            return Response({
                "message": "Order Placed Successfully",
                "payment_method": "cod",
                "internal_order_id": order.id
            }, status=status.HTTP_201_CREATED)

        else:
            try:
                client = get_razorpay_client()
            except RuntimeError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            data = {
                "amount": int(amount * 100),
                "currency": "INR",
                "payment_capture": "1"
            }
            payment_order = client.order.create(data=data)

            order = Order.objects.create(
                user=user,
                total_amount=amount,
                provider_order_id=payment_order['id'],
                payment_status='Pending',
                delivery_address=order_address
            )

            return Response({
                "order_id": payment_order['id'],
                "amount": data['amount'],
                "key": settings.RAZOR_KEY_ID,
                "internal_order_id": order.id,
                "payment_method": "online"
            }, status=status.HTTP_201_CREATED)

class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        try:
            client = get_razorpay_client()
            
            params_dict = {
                'razorpay_order_id': data['razorpay_order_id'],
                'razorpay_payment_id': data['razorpay_payment_id'],
                'razorpay_signature': data['razorpay_signature']
            }
            client.utility.verify_payment_signature(params_dict)
       
            order = Order.objects.get(provider_order_id=data['razorpay_order_id'])
            order.payment_id = data['razorpay_payment_id']
            order.signature_id = data['razorpay_signature']
            order.payment_status = 'Success'
            order.save()
   
            user_cart = Cart.objects.get(user=order.user)
            cart_items = user_cart.items.select_related('product').all()

            for item in cart_items:
                item_pricing = get_cart_item_pricing(item)
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    size=item.size,
                    price=item_pricing['unit_price']
                )

                if item.size: 
                    try:
                        product_size_obj = ProductSize.objects.get(product=item.product, size=item.size)
                    
                        if product_size_obj.stock >= item.quantity:
                            product_size_obj.stock -= item.quantity
                            product_size_obj.save()
                        else:
                            product_size_obj.stock = 0
                            product_size_obj.save()
                            
                    except ProductSize.DoesNotExist:
                        pass

            
            user_cart.items.all().delete()
            
            return Response({"status": "Payment Successful"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class OrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    

class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    
    def get_queryset(self):
        return Order.objects.filter(
            Q(payment_status='Success') | Q(provider_order_id='COD')
        ).order_by('-created_at')

class AdminOrderUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    queryset = Order.objects.all()
    
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
