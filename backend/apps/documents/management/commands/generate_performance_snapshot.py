from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from apps.documents.models import Document, DepartmentPerformanceSnapshot
from apps.documents.views_performance import PerformanceTrackingMixin


class Command(BaseCommand):
    help = 'Generate monthly performance snapshot for departments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--month',
            type=str,
            help='Month to generate snapshot for (YYYY-MM format). Defaults to previous month.',
        )

    def handle(self, *args, **options):
        # Create a temporary instance to use the mixin methods
        mixin = PerformanceTrackingMixin()
        
        # Determine target month
        if options['month']:
            try:
                year, month = map(int, options['month'].split('-'))
                target_month = datetime(year, month, 1, tzinfo=timezone.utc)
            except (ValueError, AttributeError):
                self.stdout.write(self.style.ERROR('Invalid month format. Use YYYY-MM'))
                return
        else:
            # Default to previous month
            now = timezone.now()
            if now.month == 1:
                target_month = now.replace(year=now.year - 1, month=12, day=1)
            else:
                target_month = now.replace(month=now.month - 1, day=1)
        
        self.stdout.write(f'Generating performance snapshot for {target_month.strftime("%B %Y")}...')
        
        try:
            result = mixin.generate_performance_snapshot(target_month)
            self.stdout.write(self.style.SUCCESS(
                f'Successfully generated snapshot for {result["month"]}: '
                f'{result["receipt_count"]} departments with receipt data, '
                f'{result["cc_count"]} departments with CC acknowledgment data'
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error generating snapshot: {str(e)}'))
            raise
