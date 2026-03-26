from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="temp_ref_no",
            field=models.CharField(max_length=50, null=True, blank=True, help_text="Temporary reference before official number"),
        ),
        migrations.AlterField(
            model_name="payment",
            name="status",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("ARRIVED", "Arrived"),
                    ("REGISTERED", "Registered"),
                    ("PROCESSED", "Processed"),
                ],
                default="ARRIVED",
            ),
        ),
    ]
