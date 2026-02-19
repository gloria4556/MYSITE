"""Create ContactMessage model."""
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0005_order_paymentresult'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactMessage',
            fields=[
                ('_id', models.AutoField(primary_key=True, serialize=False)),
                ('email', models.EmailField(max_length=200, null=True, blank=True)),
                ('subject', models.CharField(max_length=255, null=True, blank=True)),
                ('message', models.TextField(null=True, blank=True)),
                ('is_read', models.BooleanField(default=False)),
                ('admin_reply', models.TextField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
