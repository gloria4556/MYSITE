# Generated migration for Order tracking fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0009_wishlist'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('processing', 'Processing'),
                    ('shipped', 'Shipped'),
                    ('delivered', 'Delivered'),
                    ('cancelled', 'Cancelled'),
                    ('refunded', 'Refunded'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='tracking_number',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='estimated_delivery',
            field=models.DateField(blank=True, null=True),
        ),
    ]
