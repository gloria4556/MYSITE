# Generated migration for adding isRefunded field to Order model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0003_product_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='isRefunded',
            field=models.BooleanField(default=False),
        ),
    ]
