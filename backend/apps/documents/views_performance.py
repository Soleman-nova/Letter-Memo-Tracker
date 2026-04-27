from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, F, ExpressionWrapper, DurationField
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Document, DocumentReceipt, DocumentAcknowledgment, DepartmentPerformanceSnapshot
from apps.core.models import Department
from decimal import Decimal


class PerformanceTrackingMixin:
    """Mixin to add performance tracking functionality to DocumentViewSet"""
    
    @action(detail=False, methods=['get'], url_path='performance')
    def performance(self, request):
        """
        Calculate department performance metrics for document processing
        Returns top 5 departments for fastest receipt and CC acknowledgment times
        """
        # Get current month
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate receipt performance (DISPATCHED -> RECEIVED)
        receipt_performance = self._calculate_receipt_performance(current_month_start)
        
        # Calculate CC acknowledgment performance (DISPATCHED -> ACKNOWLEDGED)
        cc_performance = self._calculate_cc_performance(current_month_start)
        
        return Response({
            'period': {
                'month': now.strftime('%B %Y'),
                'start_date': current_month_start.strftime('%Y-%m-%d'),
                'end_date': now.strftime('%Y-%m-%d')
            },
            'receipt_performance': receipt_performance,
            'cc_performance': cc_performance
        })
    
    def _calculate_receipt_performance(self, start_date, end_date=None):
        """Calculate average time from DISPATCHED to RECEIVED by department"""
        if end_date is None:
            end_date = timezone.now()
        
        # Get documents that were dispatched within the time period and have receipts
        documents = Document.objects.filter(
            dispatched_at__isnull=False,
            dispatched_at__gte=start_date,
            dispatched_at__lt=end_date
        ).prefetch_related('receipts__department').exclude(receipts__isnull=True)
        
        department_times = {}
        
        for doc in documents:
            # Use the dispatched_at field directly
            dispatch_date = doc.dispatched_at
            
            # Calculate receipt times for each department
            for receipt in doc.receipts.all():
                dept_id = receipt.department.id
                dept_name = receipt.department.name
                dept_code = receipt.department.code
                
                # Calculate time difference in hours
                time_diff = receipt.received_at - dispatch_date
                hours = time_diff.total_seconds() / 3600
                
                if dept_id not in department_times:
                    department_times[dept_id] = {
                        'department_id': dept_id,
                        'department_name': dept_name,
                        'department_code': dept_code,
                        'total_hours': 0,
                        'count': 0,
                        'times': []
                    }
                
                department_times[dept_id]['total_hours'] += hours
                department_times[dept_id]['count'] += 1
                department_times[dept_id]['times'].append(hours)
        
        # Get all CxO departments (exclude CEO office)
        all_departments = Department.objects.exclude(code='CEO').order_by('code')
        
        # Calculate averages for all departments
        performance_data = []
        for dept in all_departments:
            if dept.id in department_times:
                data = department_times[dept.id]
                avg_hours = data['total_hours'] / data['count']
                performance_data.append({
                    'department_id': dept.id,
                    'department_name': dept.name,
                    'department_code': dept.code,
                    'average_hours': round(avg_hours, 2),
                    'document_count': data['count'],
                    'metric_type': 'receipt',
                    'has_data': True
                })
            else:
                # Department with no data
                performance_data.append({
                    'department_id': dept.id,
                    'department_name': dept.name,
                    'department_code': dept.code,
                    'average_hours': 0,
                    'document_count': 0,
                    'metric_type': 'receipt',
                    'has_data': False
                })
        
        # Sort by average hours (fastest first), departments with no data go to bottom
        performance_data.sort(key=lambda x: (not x['has_data'], x['average_hours'] if x['has_data'] else float('inf')))
        return performance_data
    
    def _calculate_cc_performance(self, start_date, end_date=None):
        """Calculate average time from DISPATCHED to CC acknowledgment by department"""
        if end_date is None:
            end_date = timezone.now()
        
        # Get documents that were dispatched within the time period
        documents = Document.objects.filter(
            dispatched_at__isnull=False,
            dispatched_at__gte=start_date,
            dispatched_at__lt=end_date
        ).prefetch_related('acknowledgments__department', 'cc_offices')
        
        department_times = {}
        
        for doc in documents:
            # Use the dispatched_at field directly
            dispatch_date = doc.dispatched_at
            
            # Get CC offices for this document
            cc_offices = set(doc.cc_offices.all())
            
            # Calculate acknowledgment times for each CC department
            for acknowledgment in doc.acknowledgments.all():
                if acknowledgment.department in cc_offices:
                    dept_id = acknowledgment.department.id
                    dept_name = acknowledgment.department.name
                    dept_code = acknowledgment.department.code
                    
                    # Calculate time difference in hours
                    time_diff = acknowledgment.acknowledged_at - dispatch_date
                    hours = time_diff.total_seconds() / 3600
                    
                    if dept_id not in department_times:
                        department_times[dept_id] = {
                            'department_id': dept_id,
                            'department_name': dept_name,
                            'department_code': dept_code,
                            'total_hours': 0,
                            'count': 0,
                            'times': []
                        }
                    
                    department_times[dept_id]['total_hours'] += hours
                    department_times[dept_id]['count'] += 1
                    department_times[dept_id]['times'].append(hours)
        
        # Get all CxO departments (exclude CEO office)
        all_departments = Department.objects.exclude(code='CEO').order_by('code')
        
        # Calculate averages for all departments
        performance_data = []
        for dept in all_departments:
            if dept.id in department_times:
                data = department_times[dept.id]
                avg_hours = data['total_hours'] / data['count']
                performance_data.append({
                    'department_id': dept.id,
                    'department_name': dept.name,
                    'department_code': dept.code,
                    'average_hours': round(avg_hours, 2),
                    'document_count': data['count'],
                    'metric_type': 'cc_acknowledgment',
                    'has_data': True
                })
            else:
                # Department with no data
                performance_data.append({
                    'department_id': dept.id,
                    'department_name': dept.name,
                    'department_code': dept.code,
                    'average_hours': 0,
                    'document_count': 0,
                    'metric_type': 'cc_acknowledgment',
                    'has_data': False
                })
        
        # Sort by average hours (fastest first), departments with no data go to bottom
        performance_data.sort(key=lambda x: (not x['has_data'], x['average_hours'] if x['has_data'] else float('inf')))
        return performance_data
    
    @action(detail=False, methods=['get'], url_path='performance/history')
    def performance_history(self, request):
        """
        Get historical performance data for a specific month
        Query params: month (YYYY-MM format, e.g., '2026-03')
        """
        month_str = request.query_params.get('month')
        
        if not month_str:
            return Response({'error': 'month parameter is required (format: YYYY-MM)'}, status=400)
        
        try:
            # Parse month string
            year, month = map(int, month_str.split('-'))
            month_start = datetime(year, month, 1).replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid month format. Use YYYY-MM'}, status=400)
        
        # Get snapshots for this month
        receipt_snapshots = DepartmentPerformanceSnapshot.objects.filter(
            month=month_start,
            metric_type='receipt'
        ).select_related('department').order_by('rank')
        
        cc_snapshots = DepartmentPerformanceSnapshot.objects.filter(
            month=month_start,
            metric_type='cc_acknowledgment'
        ).select_related('department').order_by('rank')
        
        # Convert to response format
        receipt_performance = [{
            'department_id': snap.department.id,
            'department_name': snap.department.name,
            'department_code': snap.department.code,
            'average_hours': float(snap.average_hours),
            'document_count': snap.document_count,
            'rank': snap.rank,
            'metric_type': 'receipt',
            'has_data': snap.document_count > 0
        } for snap in receipt_snapshots]
        
        cc_performance = [{
            'department_id': snap.department.id,
            'department_name': snap.department.name,
            'department_code': snap.department.code,
            'average_hours': float(snap.average_hours),
            'document_count': snap.document_count,
            'rank': snap.rank,
            'metric_type': 'cc_acknowledgment',
            'has_data': snap.document_count > 0
        } for snap in cc_snapshots]
        
        return Response({
            'period': {
                'month': month_start.strftime('%B %Y'),
                'start_date': month_start.strftime('%Y-%m-%d'),
            },
            'receipt_performance': receipt_performance,
            'cc_performance': cc_performance
        })
    
    def generate_performance_snapshot(self, target_month):
        """
        Generate performance snapshot for a specific month
        target_month: datetime object representing the first day of the month
        """
        # Calculate month boundaries
        month_start = target_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        
        # Calculate performance for the month
        receipt_data = self._calculate_receipt_performance(month_start, month_end)
        cc_data = self._calculate_cc_performance(month_start, month_end)
        
        # Store receipt performance snapshots
        for rank, dept_perf in enumerate([d for d in receipt_data if d['has_data']], 1):
            DepartmentPerformanceSnapshot.objects.update_or_create(
                department_id=dept_perf['department_id'],
                month=month_start.date(),
                metric_type='receipt',
                defaults={
                    'average_hours': Decimal(str(dept_perf['average_hours'])),
                    'document_count': dept_perf['document_count'],
                    'rank': rank
                }
            )
        
        # Store CC performance snapshots
        for rank, dept_perf in enumerate([d for d in cc_data if d['has_data']], 1):
            DepartmentPerformanceSnapshot.objects.update_or_create(
                department_id=dept_perf['department_id'],
                month=month_start.date(),
                metric_type='cc_acknowledgment',
                defaults={
                    'average_hours': Decimal(str(dept_perf['average_hours'])),
                    'document_count': dept_perf['document_count'],
                    'rank': rank
                }
            )
        
        return {
            'month': month_start.strftime('%B %Y'),
            'receipt_count': len([d for d in receipt_data if d['has_data']]),
            'cc_count': len([d for d in cc_data if d['has_data']])
        }
