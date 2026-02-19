# Generated migration for adding transfer payment fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0007_product_pricecurrency'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='transferConfirmed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='order',
            name='transferConfirmedAt',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
