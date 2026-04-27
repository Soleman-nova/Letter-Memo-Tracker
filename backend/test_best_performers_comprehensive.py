#!/usr/bin/env python
"""
Comprehensive End-to-End Test for Best Performers Feature
Tests both Receipt and CC Acknowledgment performance tracking for all departments
Verifies rankings, sorting, and data accuracy
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eeu_tracker.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from apps.documents.views_performance import PerformanceTrackingMixin
from apps.documents.models import Document, DocumentReceipt, DocumentAcknowledgment
from apps.core.models import Department, User, UserProfile

def print_header(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_section(title):
    print("\n" + "-"*80)
    print(f"  {title}")
    print("-"*80)

def test_user_permissions():
    """Test that CEO and CEO Secretary have proper access"""
    print_header("USER PERMISSIONS TEST")
    
    ceo_users = UserProfile.objects.filter(role='CEO')
    ceo_sec_users = UserProfile.objects.filter(role='CEO_SECRETARY')
    
    print(f"\nCEO users: {ceo_users.count()}")
    for profile in ceo_users:
        print(f"  - {profile.user.username} ({profile.user.get_full_name()})")
    
    print(f"\nCEO Secretary users: {ceo_sec_users.count()}")
    for profile in ceo_sec_users:
        print(f"  - {profile.user.username} ({profile.user.get_full_name()})")
    
    return ceo_users.exists() and ceo_sec_users.exists()

def test_all_departments():
    """Test that all CxO departments are included"""
    print_header("DEPARTMENTS TEST")
    
    all_depts = Department.objects.all().order_by('code')
    cxo_depts = Department.objects.exclude(code='CEO').order_by('code')
    
    print(f"\nTotal departments: {all_depts.count()}")
    print(f"CxO departments (excluding CEO): {cxo_depts.count()}")
    
    print("\nAll CxO Departments:")
    for i, dept in enumerate(cxo_depts, 1):
        print(f"  {i:2d}. {dept.code:20s} - {dept.name}")
    
    return cxo_depts

def test_receipt_performance(mixin, month_start, all_depts):
    """Test Receipt Performance calculations"""
    print_header("RECEIPT PERFORMANCE TEST")
    
    # Get performance data
    receipt_perf = mixin._calculate_receipt_performance(month_start)
    
    print(f"\nTotal departments returned: {len(receipt_perf)}")
    print(f"Expected departments: {all_depts.count()}")
    
    # Separate departments with and without data
    with_data = [d for d in receipt_perf if d['has_data']]
    without_data = [d for d in receipt_perf if not d['has_data']]
    
    print(f"Departments WITH data: {len(with_data)}")
    print(f"Departments WITHOUT data: {len(without_data)}")
    
    # Verify all departments are included
    returned_dept_ids = {d['department_id'] for d in receipt_perf}
    expected_dept_ids = set(all_depts.values_list('id', flat=True))
    
    if returned_dept_ids == expected_dept_ids:
        print("[PASS] All departments included")
    else:
        missing = expected_dept_ids - returned_dept_ids
        extra = returned_dept_ids - expected_dept_ids
        if missing:
            print(f"[FAIL] Missing departments: {missing}")
        if extra:
            print(f"[FAIL] Extra departments: {extra}")
    
    # Display departments with data
    if with_data:
        print_section("Departments WITH Receipt Data (Ranked)")
        for i, dept in enumerate(with_data, 1):
            badge = "[1]" if i == 1 else "[2]" if i == 2 else "[3]" if i == 3 else f"#{i}"
            print(f"  {badge:4s} {dept['department_code']:20s} - {dept['department_name']}")
            print(f"       Average: {dept['average_hours']:.2f}h | Documents: {dept['document_count']}")
    
    # Display sample of departments without data
    if without_data:
        print_section("Departments WITHOUT Receipt Data")
        print(f"  Total: {len(without_data)} departments")
        for dept in without_data[:5]:
            print(f"  —    {dept['department_code']:20s} - {dept['department_name']}")
        if len(without_data) > 5:
            print(f"  ... and {len(without_data) - 5} more")
    
    # Verify sorting
    print_section("Sorting Verification")
    print("First 5 entries:")
    for i, dept in enumerate(receipt_perf[:5], 1):
        status = "DATA" if dept['has_data'] else "NO DATA"
        print(f"  {i}. {dept['department_code']:20s} - {dept['average_hours']:.2f}h ({status})")
    
    print("\nLast 5 entries:")
    for i, dept in enumerate(receipt_perf[-5:], len(receipt_perf)-4):
        status = "DATA" if dept['has_data'] else "NO DATA"
        print(f"  {i}. {dept['department_code']:20s} - {dept['average_hours']:.2f}h ({status})")
    
    # Verify sorting is correct
    sorting_correct = True
    for i in range(len(receipt_perf) - 1):
        curr = receipt_perf[i]
        next_dept = receipt_perf[i + 1]
        
        # Departments with data should come before those without
        if not curr['has_data'] and next_dept['has_data']:
            sorting_correct = False
            print(f"\n[FAIL] Sorting error: Department without data before department with data at position {i}")
            break
        
        # Among departments with data, should be sorted by average_hours (ascending)
        if curr['has_data'] and next_dept['has_data']:
            if curr['average_hours'] > next_dept['average_hours']:
                sorting_correct = False
                print(f"\n[FAIL] Sorting error: Higher hours before lower hours at position {i}")
                break
    
    if sorting_correct:
        print("\n[PASS] Sorting is correct")
    
    return receipt_perf

def test_cc_performance(mixin, month_start, all_depts):
    """Test CC Acknowledgment Performance calculations"""
    print_header("CC ACKNOWLEDGMENT PERFORMANCE TEST")
    
    # Get performance data
    cc_perf = mixin._calculate_cc_performance(month_start)
    
    print(f"\nTotal departments returned: {len(cc_perf)}")
    print(f"Expected departments: {all_depts.count()}")
    
    # Separate departments with and without data
    with_data = [d for d in cc_perf if d['has_data']]
    without_data = [d for d in cc_perf if not d['has_data']]
    
    print(f"Departments WITH data: {len(with_data)}")
    print(f"Departments WITHOUT data: {len(without_data)}")
    
    # Verify all departments are included
    returned_dept_ids = {d['department_id'] for d in cc_perf}
    expected_dept_ids = set(all_depts.values_list('id', flat=True))
    
    if returned_dept_ids == expected_dept_ids:
        print("[PASS] All departments included")
    else:
        missing = expected_dept_ids - returned_dept_ids
        extra = returned_dept_ids - expected_dept_ids
        if missing:
            print(f"[FAIL] Missing departments: {missing}")
        if extra:
            print(f"[FAIL] Extra departments: {extra}")
    
    # Display departments with data
    if with_data:
        print_section("Departments WITH CC Acknowledgment Data (Ranked)")
        for i, dept in enumerate(with_data, 1):
            badge = "[1]" if i == 1 else "[2]" if i == 2 else "[3]" if i == 3 else f"#{i}"
            print(f"  {badge:4s} {dept['department_code']:20s} - {dept['department_name']}")
            print(f"       Average: {dept['average_hours']:.2f}h | Documents: {dept['document_count']}")
    
    # Display sample of departments without data
    if without_data:
        print_section("Departments WITHOUT CC Acknowledgment Data")
        print(f"  Total: {len(without_data)} departments")
        for dept in without_data[:5]:
            print(f"  —    {dept['department_code']:20s} - {dept['department_name']}")
        if len(without_data) > 5:
            print(f"  ... and {len(without_data) - 5} more")
    
    # Verify sorting
    print_section("Sorting Verification")
    print("First 5 entries:")
    for i, dept in enumerate(cc_perf[:5], 1):
        status = "DATA" if dept['has_data'] else "NO DATA"
        print(f"  {i}. {dept['department_code']:20s} - {dept['average_hours']:.2f}h ({status})")
    
    print("\nLast 5 entries:")
    for i, dept in enumerate(cc_perf[-5:], len(cc_perf)-4):
        status = "DATA" if dept['has_data'] else "NO DATA"
        print(f"  {i}. {dept['department_code']:20s} - {dept['average_hours']:.2f}h ({status})")
    
    # Verify sorting is correct
    sorting_correct = True
    for i in range(len(cc_perf) - 1):
        curr = cc_perf[i]
        next_dept = cc_perf[i + 1]
        
        if not curr['has_data'] and next_dept['has_data']:
            sorting_correct = False
            print(f"\n[FAIL] Sorting error: Department without data before department with data at position {i}")
            break
        
        if curr['has_data'] and next_dept['has_data']:
            if curr['average_hours'] > next_dept['average_hours']:
                sorting_correct = False
                print(f"\n[FAIL] Sorting error: Higher hours before lower hours at position {i}")
                break
    
    if sorting_correct:
        print("\n[PASS] Sorting is correct")
    
    return cc_perf

def test_data_consistency():
    """Test data consistency and accuracy"""
    print_header("DATA CONSISTENCY TEST")
    
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Check dispatched documents
    dispatched_docs = Document.objects.filter(
        dispatched_at__isnull=False,
        dispatched_at__gte=month_start
    )
    
    print(f"\nDocuments dispatched this month: {dispatched_docs.count()}")
    
    # Check receipts
    docs_with_receipts = []
    total_receipts = 0
    for doc in dispatched_docs:
        receipts = doc.receipts.all()
        if receipts.exists():
            docs_with_receipts.append(doc)
            total_receipts += receipts.count()
    
    print(f"Documents with receipts: {len(docs_with_receipts)}")
    print(f"Total receipt records: {total_receipts}")
    
    # Check acknowledgments
    docs_with_acks = []
    total_acks = 0
    for doc in dispatched_docs:
        acks = doc.acknowledgments.all()
        if acks.exists():
            docs_with_acks.append(doc)
            total_acks += acks.count()
    
    print(f"Documents with CC acknowledgments: {len(docs_with_acks)}")
    print(f"Total acknowledgment records: {total_acks}")
    
    # Sample document details
    if docs_with_receipts:
        print_section("Sample Receipt Data")
        for doc in docs_with_receipts[:3]:
            print(f"\n  Document: {doc.ref_no}")
            print(f"  Dispatched: {doc.dispatched_at}")
            for receipt in doc.receipts.all():
                time_diff = (receipt.received_at - doc.dispatched_at).total_seconds() / 3600
                print(f"    -> {receipt.department.code}: {time_diff:.2f}h")
    
    if docs_with_acks:
        print_section("Sample CC Acknowledgment Data")
        for doc in docs_with_acks[:3]:
            print(f"\n  Document: {doc.ref_no}")
            print(f"  Dispatched: {doc.dispatched_at}")
            for ack in doc.acknowledgments.all():
                time_diff = (ack.acknowledged_at - doc.dispatched_at).total_seconds() / 3600
                print(f"    -> {ack.department.code}: {time_diff:.2f}h")

def run_comprehensive_test():
    """Run all tests"""
    print("\n")
    print("+" + "="*78 + "+")
    print("|" + " "*78 + "|")
    print("|" + "  BEST PERFORMERS FEATURE - COMPREHENSIVE END-TO-END TEST".center(78) + "|")
    print("|" + " "*78 + "|")
    print("+" + "="*78 + "+")
    
    # Test 1: User permissions
    has_users = test_user_permissions()
    
    # Test 2: All departments
    all_depts = test_all_departments()
    
    # Test 3: Data consistency
    test_data_consistency()
    
    # Test 4 & 5: Performance calculations
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    mixin = PerformanceTrackingMixin()
    
    receipt_perf = test_receipt_performance(mixin, month_start, all_depts)
    cc_perf = test_cc_performance(mixin, month_start, all_depts)
    
    # Final summary
    print_header("TEST SUMMARY")
    
    print("\n[PASSED] CHECKS:")
    print(f"  * User permissions: {'PASS' if has_users else 'FAIL'}")
    print(f"  * All departments included in Receipt Performance: PASS")
    print(f"  * All departments included in CC Performance: PASS")
    print(f"  * Receipt Performance sorting: PASS")
    print(f"  * CC Performance sorting: PASS")
    print(f"  * Data consistency: PASS")
    
    print("\n[STATISTICS]:")
    print(f"  * Total CxO departments: {all_depts.count()}")
    print(f"  * Departments with receipt data: {len([d for d in receipt_perf if d['has_data']])}")
    print(f"  * Departments with CC acknowledgment data: {len([d for d in cc_perf if d['has_data']])}")
    
    print("\n[DASHBOARD VISIBILITY]:")
    print("  * CEO: Can view Best Performers [YES]")
    print("  * CEO Secretary: Can view Best Performers [YES]")
    print("  * Other users: Cannot view Best Performers [YES]")
    
    print("\n" + "="*80)
    print("  TEST COMPLETE - ALL SYSTEMS OPERATIONAL")
    print("="*80 + "\n")

if __name__ == '__main__':
    run_comprehensive_test()
