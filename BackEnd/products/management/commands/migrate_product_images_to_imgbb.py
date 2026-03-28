from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from products.imgbb import ImgBBUploadError, is_remote_image, upload_local_image
from products.models import Product, ProductImage


class Command(BaseCommand):
    help = 'Uploads existing product and gallery images from BackEnd/media to ImgBB and stores their remote URLs.'
    requires_system_checks = []

    def handle(self, *args, **options):
        product_updated, product_failed = self._migrate_queryset(Product.objects.exclude(image__isnull=True).exclude(image=''))
        gallery_updated, gallery_failed = self._migrate_queryset(ProductImage.objects.exclude(image__isnull=True).exclude(image=''))

        self.stdout.write(
            self.style.SUCCESS(
                f'Product images migrated: {product_updated}, gallery images migrated: {gallery_updated}'
            )
        )

        if product_failed or gallery_failed:
            self.stdout.write(
                self.style.WARNING(
                    f'Failed product images: {product_failed}, failed gallery images: {gallery_failed}'
                )
            )

    def _migrate_queryset(self, queryset):
        updated = 0
        failed = 0

        for instance in queryset:
            current_value = str(instance.image).strip()

            if not current_value or is_remote_image(current_value):
                continue

            local_path = self._resolve_local_path(current_value)
            if local_path is None:
                failed += 1
                self.stderr.write(self.style.ERROR(f'Local image not found for "{current_value}"'))
                continue

            try:
                instance.image = upload_local_image(local_path)
                instance.save(update_fields=['image'])
                updated += 1
            except ImgBBUploadError as exc:
                failed += 1
                self.stderr.write(self.style.ERROR(str(exc)))

        return updated, failed

    def _resolve_local_path(self, image_value):
        cleaned_value = image_value.lstrip('/\\')
        candidates = [
            Path(settings.BASE_DIR) / cleaned_value,
            Path(settings.BASE_DIR) / 'media' / cleaned_value,
        ]

        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return candidate

        return None
