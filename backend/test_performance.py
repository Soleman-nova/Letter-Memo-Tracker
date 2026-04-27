import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from apps.documents.models import Document, DocumentReceipt, DocumentAcknowledgment
from apps.core.models import Department, User
from apps.documents.views_performance import PerformanceTrackingMixin

def test_performance_calculations():
    print("\n" + "="*60)
    print("TESTING BEST PERFORMERS FEATURE")
    print("="*60)
    
    # Get current month start
    now = timezone.now()
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Check for documents with dispatched_at in current month
    dispatched_docs = Document.objects.filter(
        dispatched_at__isnull=False,
        dispatched_at__gte=current_month_start
    )
    
    print(f"\n📊 Documents dispatched this month: {dispatched_docs.count()}")
    
    if dispatched_docs.count() > 0:
        print("\nSample dispatched documents:")
        for doc in dispatched_docs[:5]:
            print(f"  - {doc.ref_no}: Dispatched at {doc.dispatched_at}")
            receipts = doc.receipts.all()
            print(f"    Receipts: {receipts.count()}")
            for receipt in receipts:
                time_diff = (receipt.received_at - doc.dispatched_at).total_seconds() / 3600
                print(f"      • {receipt.department.code}: {time_diff:.2f} hours")
            
            acknowledgments = doc.acknowledgments.all()
            print(f"    CC Acknowledgments: {acknowledgments.count()}")
            for ack in acknowledgments:
                time_diff = (ack.acknowledged_at - doc.dispatched_at).total_seconds() / 3600
                print(f"      • {ack.department.code}: {time_diff:.2f} hours")
    
    # Test performance calculations
    print("\n" + "-"*60)
    print("TESTING PERFORMANCE CALCULATIONS")
    print("-"*60)
    
    mixin = PerformanceTrackingMixin()
    
    # Test receipt performance
    print("\n🏆 Receipt Performance (DISPATCHED → RECEIVED):")
    receipt_perf = mixin._calculate_receipt_performance(current_month_start)
    
    if receipt_perf:
        print(f"\nTotal departments: {len(receipt_perf)}")
        print(f"Departments with data: {len([d for d in receipt_perf if d['has_data']])}")
        print(f"Departments without data: {len([d for d in receipt_perf if not d['has_data']])}")
        
        print("\nTop 5 Performers:")
        for i, dept in enumerate(receipt_perf[:5], 1):
            if dept['has_data']:
                print(f"  {i}. {dept['department_code']} - {dept['department_name']}")
                print(f"     Average: {dept['average_hours']}h | Documents: {dept['document_count']}")
            else:
                print(f"  {i}. {dept['department_code']} - {dept['department_name']}")
                print(f"     No data")
        
        print("\nDepartments with no data:")
        no_data = [d for d in receipt_perf if not d['has_data']]
        for dept in no_data[:3]:
            print(f"  - {dept['department_code']}: {dept['department_name']}")
        if len(no_data) > 3:
            print(f"  ... and {len(no_data) - 3} more")
    else:
        print("  No performance data available")
    
    # Test CC acknowledgment performance
    print("\n🏆 CC Acknowledgment Performance (DISPATCHED → ACKNOWLEDGED):")
    cc_perf = mixin._calculate_cc_performance(current_month_start)
    
    if cc_perf:
        print(f"\nTotal departments: {len(cc_perf)}")
        print(f"Departments with data: {len([d for d in cc_perf if d['has_data']])}")
        print(f"Departments without data: {len([d for d in cc_perf if not d['has_data']])}")
        
        print("\nTop 5 Performers:")
        for i, dept in enumerate(cc_perf[:5], 1):
            if dept['has_data']:
                print(f"  {i}. {dept['department_code']} - {dept['department_name']}")
                print(f"     Average: {dept['average_hours']}h | Documents: {dept['document_count']}")
            else:
                print(f"  {i}. {dept['department_code']} - {dept['department_name']}")
                print(f"     No data")
        
        print("\nDepartments with no data:")
        no_data = [d for d in cc_perf if not d['has_data']]
        for dept in no_data[:3]:
            print(f"  - {dept['department_code']}: {dept['department_name']}")
        if len(no_data) > 3:
            print(f"  ... and {len(no_data) - 3} more")
    else:
        print("  No performance data available")
    
    # Check all departments
    print("\n" + "-"*60)
    print("ALL DEPARTMENTS CHECK")
    print("-"*60)
    all_depts = Department.objects.exclude(code='CEO').order_by('code')
    print(f"\nTotal CxO departments (excluding CEO): {all_depts.count()}")
    print("\nDepartments:")
    for dept in all_depts:
        print(f"  - {dept.code}: {dept.name}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_performance_calculations()
