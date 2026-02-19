# Generated migration for adding priceCurrency field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0006_contactmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='priceCurrency',
            field=models.CharField(
                choices=[
                    ('USD', 'US Dollar'),
                    ('EUR', 'Euro'),
                    ('GBP', 'British Pound'),
                    ('JPY', 'Japanese Yen'),
                    ('AUD', 'Australian Dollar'),
                    ('CAD', 'Canadian Dollar'),
                    ('CHF', 'Swiss Franc'),
                    ('CNY', 'Chinese Yuan'),
                    ('INR', 'Indian Rupee'),
                    ('NGN', 'Nigerian Naira'),
                    ('KES', 'Kenyan Shilling'),
                    ('GHS', 'Ghanaian Cedi'),
                    ('EGP', 'Egyptian Pound'),
                    ('ZAR', 'South African Rand'),
                    ('BRL', 'Brazilian Real'),
                    ('MXN', 'Mexican Peso'),
                ],
                default='USD',
                max_length=10,
            ),
        ),
    ]
