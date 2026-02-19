# Generated migration for adding paymentResult field to Order model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0004_order_isrefunded'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='paymentResult',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
    ]
