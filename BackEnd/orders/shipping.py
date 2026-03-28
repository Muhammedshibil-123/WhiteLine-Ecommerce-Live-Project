import json
import math
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings

from .models import DeliverySettings, PincodeLocationCache
from .pricing import calculate_cart_totals, money


NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
PINCODE_COORDINATE_STEP = Decimal('0.000001')


class DeliveryCalculationError(Exception):
    pass


def normalize_pincode(pincode):
    normalized = ''.join(str(pincode or '').strip().split())
    if not normalized.isdigit() or len(normalized) != 6:
        raise DeliveryCalculationError('Please enter a valid 6-digit pincode.')
    return normalized


def _nominatim_headers():
    headers = {
        'User-Agent': getattr(
            settings,
            'DELIVERY_GEO_USER_AGENT',
            'Whiteline/1.0 (delivery-distance-calculation)',
        )
    }
    support_email = getattr(settings, 'DELIVERY_GEO_EMAIL', '')
    if support_email:
        headers['From'] = support_email
    return headers


def _run_nominatim_search(params):
    request = Request(
        f'{NOMINATIM_SEARCH_URL}?{urlencode(params)}',
        headers=_nominatim_headers(),
    )

    try:
        with urlopen(request, timeout=12) as response:
            data = json.loads(response.read().decode('utf-8'))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise DeliveryCalculationError(
            'Unable to calculate delivery for this pincode right now. Please try again.'
        ) from exc

    return data[0] if data else None


def get_pincode_location(pincode):
    normalized = normalize_pincode(pincode)
    cached_location = PincodeLocationCache.objects.filter(pincode=normalized).first()
    if cached_location:
        return {
            'pincode': normalized,
            'latitude': cached_location.latitude,
            'longitude': cached_location.longitude,
            'display_name': cached_location.display_name,
        }

    search_attempts = [
        {
            'postalcode': normalized,
            'countrycodes': 'in',
            'format': 'jsonv2',
            'limit': 1,
        },
        {
            'q': f'{normalized}, India',
            'countrycodes': 'in',
            'format': 'jsonv2',
            'limit': 1,
        },
    ]

    result = None
    for params in search_attempts:
        result = _run_nominatim_search(params)
        if result:
            break

    if not result:
        raise DeliveryCalculationError('We could not locate that delivery pincode.')

    latitude = Decimal(str(result['lat'])).quantize(PINCODE_COORDINATE_STEP)
    longitude = Decimal(str(result['lon'])).quantize(PINCODE_COORDINATE_STEP)

    cached_location, _ = PincodeLocationCache.objects.update_or_create(
        pincode=normalized,
        defaults={
            'latitude': latitude,
            'longitude': longitude,
            'display_name': result.get('display_name', ''),
        }
    )

    return {
        'pincode': normalized,
        'latitude': cached_location.latitude,
        'longitude': cached_location.longitude,
        'display_name': cached_location.display_name,
    }


def haversine_distance_km(origin_lat, origin_lng, destination_lat, destination_lng):
    earth_radius_km = 6371.0

    origin_lat_rad = math.radians(float(origin_lat))
    destination_lat_rad = math.radians(float(destination_lat))
    delta_lat = math.radians(float(destination_lat) - float(origin_lat))
    delta_lng = math.radians(float(destination_lng) - float(origin_lng))

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(origin_lat_rad)
        * math.cos(destination_lat_rad)
        * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return money(Decimal(str(earth_radius_km * c)))


def get_delivery_estimate(pincode):
    delivery_settings = DeliverySettings.load()
    if not delivery_settings.warehouse_pincode:
        raise DeliveryCalculationError('Delivery settings are not configured yet.')
    warehouse_pincode = normalize_pincode(delivery_settings.warehouse_pincode)
    destination_pincode = normalize_pincode(pincode)

    warehouse_location = get_pincode_location(warehouse_pincode)
    destination_location = get_pincode_location(destination_pincode)

    distance_km = haversine_distance_km(
        warehouse_location['latitude'],
        warehouse_location['longitude'],
        destination_location['latitude'],
        destination_location['longitude'],
    )
    delivery_charge = money(distance_km * Decimal(delivery_settings.rate_per_km or 0))

    return {
        'warehouse_pincode': warehouse_pincode,
        'destination_pincode': destination_pincode,
        'warehouse_location_name': warehouse_location['display_name'],
        'destination_location_name': destination_location['display_name'],
        'rate_per_km': money(delivery_settings.rate_per_km or 0),
        'distance_km': distance_km,
        'delivery_charge': delivery_charge,
    }


def build_checkout_pricing(cart_items, destination_pincode):
    cart_totals = calculate_cart_totals(cart_items)
    delivery_totals = get_delivery_estimate(destination_pincode)
    payable_total = money(cart_totals['grand_total'] + delivery_totals['delivery_charge'])

    return {
        **cart_totals,
        **delivery_totals,
        'payable_total': payable_total,
    }


def serialize_pricing_payload(payload):
    serialized = {}
    for key, value in payload.items():
        if isinstance(value, Decimal):
            serialized[key] = f'{value:.2f}'
        else:
            serialized[key] = value
    return serialized
