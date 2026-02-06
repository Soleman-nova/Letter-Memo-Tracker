from django.core.management.base import BaseCommand
from apps.core.models import Department


class Command(BaseCommand):
    help = 'Seed departments into the database'

    def handle(self, *args, **options):
        departments_data = [
            {'code': 'CEO', 'name': 'Chief Executive Officer'},
            {'code': 'Audit', 'name': 'Internal Audit'},
            {'code': 'Legal&Ethics', 'name': 'Legal Service and Ethics'},
            {'code': 'SPlanning', 'name': 'Strategic Planning and Investment'},
            {'code': 'Communication', 'name': 'Communication'},
            {'code': 'NIM', 'name': 'Network Infrastructure Management'},
            {'code': 'Marketing', 'name': 'Marketing, Sales and Customer Service'},
            {'code': 'Finance', 'name': 'Finance'},
            {'code': 'HR', 'name': 'Human Resource'},
            {'code': 'IT', 'name': 'Information Technology'},
            {'code': 'P&Qmgt', 'name': 'Process and Quality Management'},
            {'code': 'PPM', 'name': 'EEU Projects Portfolio Management'},
            {'code': 'SC&PGS', 'name': 'Supply Chain Management and PGS'},
            {'code': 'RGN Coordination', 'name': 'Region Coordination'},
        ]

        created_count = 0
        for dept_data in departments_data:
            dept, created = Department.objects.get_or_create(
                code=dept_data['code'],
                defaults={'name': dept_data['name']}
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created department: {dept.code} - {dept.name}')
                )
            else:
                self.stdout.write(f'Department already exists: {dept.code}')

        self.stdout.write(
            self.style.SUCCESS(f'\nTotal: {created_count} new departments created')
        )
