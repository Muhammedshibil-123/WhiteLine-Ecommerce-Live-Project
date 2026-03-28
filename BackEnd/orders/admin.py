from django.contrib import admin

from .models import DeliverySettings, GeneralSettings, Order, OrderItem, PincodeLocationCache


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'delivery_charge', 'delivery_distance_km', 'status', 'payment_status')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('id', 'user__username', 'delivery_address__pincode')
    inlines = [OrderItemInline]


@admin.register(DeliverySettings)
class DeliverySettingsAdmin(admin.ModelAdmin):
    list_display = ('warehouse_pincode', 'rate_per_km', 'updated_at')


@admin.register(GeneralSettings)
class GeneralSettingsAdmin(admin.ModelAdmin):
    list_display = ('updated_at',)


@admin.register(PincodeLocationCache)
class PincodeLocationCacheAdmin(admin.ModelAdmin):
    list_display = ('pincode', 'latitude', 'longitude', 'updated_at')
    search_fields = ('pincode', 'display_name')
