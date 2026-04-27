#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eeu_tracker.settings')
django.setup()

from django.utils import timezone
from apps.documents.views_performance import PerformanceTrackingMixin
from apps.documents.models import Document
from apps.core.models import Department

# Get current month
now = timezone.now()
month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

print("="*70)
print("BEST PERFORMERS FEATURE - END-TO-END TEST")
print("="*70)

# Check data
print("\n1. DATA CHECK:")
print("-" * 70)
dispatched_docs = Document.objects.filter(
    dispatched_at__isnull=False,
    dispatched_at__gte=month_start
)
print(f"Documents dispatched this month: {dispatched_docs.count()}")

docs_with_receipts = [d for d in dispatched_docs if d.receipts.exists()]
docs_with_acks = [d for d in dispatched_docs if d.acknowledgments.exists()]

print(f"Documents with receipts: {len(docs_with_receipts)}")
print(f"Documents with CC acknowledgments: {len(docs_with_acks)}")

all_depts = Department.objects.exclude(code='CEO').order_by('code')
print(f"Total CxO departments (excluding CEO): {all_depts.count()}")

# Test performance calculations
print("\n2. RECEIPT PERFORMANCE TEST:")
print("-" * 70)
mixin = PerformanceTrackingMixin()
receipt_perf = mixin._calculate_receipt_performance(month_start)

print(f"Total departments returned: {len(receipt_perf)}")
with_data = [d for d in receipt_perf if d['has_data']]
without_data = [d for d in receipt_perf if not d['has_data']]
print(f"Departments with data: {len(with_data)}")
print(f"Departments without data: {len(without_data)}")

if with_data:
    print("\nTop performers with data:")
    for i, dept in enumerate(with_data[:5], 1):
        print(f"  {i}. {dept['department_code']} - {dept['department_name']}")
        print(f"     Average: {dept['average_hours']}h | Documents: {dept['document_count']}")

if without_data:
    print(f"\nDepartments without data: {len(without_data)}")
    for dept in without_data[:3]:
        print(f"  - {dept['department_code']}: {dept['department_name']}")
    if len(without_data) > 3:
        print(f"  ... and {len(without_data) - 3} more")

# Test CC acknowledgment
print("\n3. CC ACKNOWLEDGMENT PERFORMANCE TEST:")
print("-" * 70)
cc_perf = mixin._calculate_cc_performance(month_start)

print(f"Total departments returned: {len(cc_perf)}")
with_data = [d for d in cc_perf if d['has_data']]
without_data = [d for d in cc_perf if not d['has_data']]
print(f"Departments with data: {len(with_data)}")
print(f"Departments without data: {len(without_data)}")

if with_data:
    print("\nTop performers with data:")
    for i, dept in enumerate(with_data[:5], 1):
        print(f"  {i}. {dept['department_code']} - {dept['department_name']}")
        print(f"     Average: {dept['average_hours']}h | Documents: {dept['document_count']}")

if without_data:
    print(f"\nDepartments without data: {len(without_data)}")
    for dept in without_data[:3]:
        print(f"  - {dept['department_code']}: {dept['department_name']}")
    if len(without_data) > 3:
        print(f"  ... and {len(without_data) - 3} more")

# Verify sorting
print("\n4. SORTING VERIFICATION:")
print("-" * 70)
print("Receipt performance - First 3 and last 3:")
for i, dept in enumerate(receipt_perf[:3], 1):
    status = "WITH DATA" if dept['has_data'] else "NO DATA"
    print(f"  {i}. {dept['department_code']}: {dept['average_hours']}h ({status})")
print("  ...")
for i, dept in enumerate(receipt_perf[-3:], len(receipt_perf)-2):
    status = "WITH DATA" if dept['has_data'] else "NO DATA"
    print(f"  {i}. {dept['department_code']}: {dept['average_hours']}h ({status})")

print("\n" + "="*70)
print("TEST COMPLETE")
print("="*70)
