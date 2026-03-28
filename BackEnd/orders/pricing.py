from decimal import Decimal, ROUND_HALF_UP


MONEY_STEP = Decimal('0.01')
ORDER_DISCOUNT_RATE = Decimal('0.10')
GST_RATE = Decimal('0.18')


def money(value):
    return Decimal(value or 0).quantize(MONEY_STEP, rounding=ROUND_HALF_UP)


def get_cart_item_pricing(cart_item):
    quantity = int(cart_item.quantity or 0)
    original_unit_price = money(cart_item.product.price)
    unit_price = money(cart_item.product.get_unit_price_for_quantity(quantity))
    original_line_total = money(original_unit_price * quantity)
    line_total = money(unit_price * quantity)
    bulk_discount_total = money(original_line_total - line_total)

    bulk_applied = bool(
        cart_item.product.has_bulk_offer()
        and quantity >= int(cart_item.product.bulk_order_min_qty or 0)
        and bulk_discount_total > 0
    )

    bulk_label = None
    if cart_item.product.has_bulk_offer():
        bulk_label = (
            f'{cart_item.product.bulk_order_min_qty}+ pcs @ '
            f'Rs.{money(cart_item.product.bulk_order_price)} each'
        )

    return {
        'quantity': quantity,
        'original_unit_price': original_unit_price,
        'unit_price': unit_price,
        'original_line_total': original_line_total,
        'line_total': line_total,
        'bulk_discount_total': bulk_discount_total,
        'bulk_applied': bulk_applied,
        'bulk_label': bulk_label,
    }


def calculate_cart_totals(cart_items):
    original_subtotal = money(0)
    subtotal = money(0)
    bulk_savings = money(0)

    for item in cart_items:
        pricing = get_cart_item_pricing(item)
        original_subtotal = money(original_subtotal + pricing['original_line_total'])
        subtotal = money(subtotal + pricing['line_total'])
        bulk_savings = money(bulk_savings + pricing['bulk_discount_total'])

    discount = money(subtotal * ORDER_DISCOUNT_RATE)
    discounted_subtotal = money(subtotal - discount)
    gst = money(discounted_subtotal * GST_RATE)
    grand_total = money(discounted_subtotal + gst)

    return {
        'original_subtotal': original_subtotal,
        'subtotal': subtotal,
        'bulk_savings': bulk_savings,
        'discount': discount,
        'discounted_subtotal': discounted_subtotal,
        'gst': gst,
        'grand_total': grand_total,
    }
