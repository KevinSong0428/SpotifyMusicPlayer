# Generated by Django 4.2.6 on 2023-12-03 01:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_room_current_song'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='device_id',
            field=models.CharField(max_length=50, null=True),
        ),
    ]
