from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0010_document_cc_offices'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='document',
            name='ec_year',
        ),
        migrations.DeleteModel(
            name='NumberSequence',
        ),
        migrations.DeleteModel(
            name='NumberingRule',
        ),
    ]
