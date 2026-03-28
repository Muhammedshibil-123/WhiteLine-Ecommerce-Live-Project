from django.db import migrations, models


VALID_FIT_VALUES = {'Regular', 'Oversized', 'Relaxed', 'Slim'}
VALID_STYLE_VALUES = {'Minimal', 'Graphic', 'Streetwear', 'Basics', 'Premium', 'Printed', 'Solid'}


def migrate_product_classification(apps, schema_editor):
    Product = apps.get_model('products', 'Product')

    fit_mapping = {
        'Half Sleeve': 'Regular',
        'Full Sleeve': 'Regular',
        'Sleeveless': 'Regular',
        'Oversized': 'Oversized',
    }
    style_mapping = {
        'Anime': 'Printed',
        'Sports': 'Printed',
        'Movie': 'Printed',
        'Motivational': 'Graphic',
        'Minimal': 'Minimal',
        'Vintage': 'Streetwear',
    }

    for product in Product.objects.all():
        product.category = product.category or 'T-Shirts'
        product.fit = fit_mapping.get(product.fit, product.fit if product.fit in VALID_FIT_VALUES else 'Regular')
        product.style = style_mapping.get(
            product.style,
            product.style if product.style in VALID_STYLE_VALUES else 'Printed',
        )
        product.save(update_fields=['category', 'fit', 'style'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_productreviewimage'),
    ]

    operations = [
        migrations.RenameField(
            model_name='product',
            old_name='theme',
            new_name='style',
        ),
        migrations.RenameField(
            model_name='product',
            old_name='sleeve_type',
            new_name='fit',
        ),
        migrations.AddField(
            model_name='product',
            name='category',
            field=models.CharField(
                choices=[
                    ('T-Shirts', 'T-Shirts'),
                    ('Shirts', 'Shirts'),
                    ('Polos', 'Polos'),
                    ('Hoodies', 'Hoodies'),
                    ('Jackets', 'Jackets'),
                    ('Joggers', 'Joggers'),
                    ('Shorts', 'Shorts'),
                    ('Co-ords', 'Co-ords'),
                    ('Basics', 'Basics'),
                ],
                default='T-Shirts',
                max_length=30,
            ),
        ),
        migrations.RunPython(migrate_product_classification, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='product',
            name='fit',
            field=models.CharField(
                choices=[
                    ('Regular', 'Regular'),
                    ('Oversized', 'Oversized'),
                    ('Relaxed', 'Relaxed'),
                    ('Slim', 'Slim'),
                ],
                default='Regular',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='product',
            name='style',
            field=models.CharField(
                choices=[
                    ('Minimal', 'Minimal'),
                    ('Graphic', 'Graphic'),
                    ('Streetwear', 'Streetwear'),
                    ('Basics', 'Basics'),
                    ('Premium', 'Premium'),
                    ('Printed', 'Printed'),
                    ('Solid', 'Solid'),
                ],
                default='Printed',
                max_length=30,
            ),
        ),
    ]
