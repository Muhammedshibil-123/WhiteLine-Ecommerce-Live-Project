import base64
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload'


class ImgBBUploadError(Exception):
    pass


def is_remote_image(image_value):
    return isinstance(image_value, str) and image_value.startswith(('http://', 'https://'))


def _get_api_key():
    api_key = settings.IMGBB_API_KEY
    if not api_key:
        raise ImgBBUploadError('IMGBB_API_KEY is not configured.')
    return api_key


def _upload_image_bytes(image_bytes, image_name):
    payload = urlencode(
        {
            'key': _get_api_key(),
            'name': image_name,
            'image': base64.b64encode(image_bytes).decode('ascii'),
        }
    ).encode('utf-8')

    request = Request(
        IMGBB_UPLOAD_URL,
        data=payload,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )

    try:
        with urlopen(request, timeout=60) as response:
            response_payload = json.loads(response.read().decode('utf-8'))
    except HTTPError as exc:
        error_body = exc.read().decode('utf-8', errors='ignore')
        raise ImgBBUploadError(f'ImgBB upload failed for {image_name}: {error_body or exc.reason}') from exc
    except URLError as exc:
        raise ImgBBUploadError(f'ImgBB upload failed for {image_name}: {exc.reason}') from exc
    except Exception as exc:
        raise ImgBBUploadError(f'ImgBB upload failed for {image_name}: {exc}') from exc

    if not response_payload.get('success'):
        error_message = response_payload.get('error', {}).get('message') or 'Unknown ImgBB error.'
        raise ImgBBUploadError(f'ImgBB upload failed for {image_name}: {error_message}')

    return response_payload['data']['url']


def upload_uploaded_file(uploaded_file):
    if hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)

    image_name = Path(getattr(uploaded_file, 'name', 'upload')).name
    image_bytes = uploaded_file.read()
    return _upload_image_bytes(image_bytes, image_name)


def upload_local_image(local_path):
    path = Path(local_path)
    with path.open('rb') as image_file:
        return _upload_image_bytes(image_file.read(), path.name)
