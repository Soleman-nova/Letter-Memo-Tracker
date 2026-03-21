from django.contrib import admin
from .models import Payment, PaymentHistory


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'ref_no', 'vendor_name', 'amount', 'currency', 'status', 
        'payment_type', 'priority', 'registered_by', 'approved_by'
    ]
    list_filter = ['status', 'payment_type', 'priority', 'currency', 'created_at']
    search_fields = ['ref_no', 'tt_number', 'vendor_name', 'invoice_number']
    readonly_fields = ['registration_date', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Registration Details', {
            'fields': ('ref_no', 'tt_number', 'arrival_date', 'registered_by', 'registration_date')
        }),
        ('Payment Information', {
            'fields': ('amount', 'currency', 'payment_type', 'vendor_name', 'invoice_number', 
                      'description', 'payment_date', 'due_date')
        }),
        ('Workflow', {
            'fields': ('status', 'priority', 'approved_by', 'approval_date', 'ceo_notes')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['payment', 'action', 'performed_by', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['payment__ref_no', 'action', 'performed_by__username']
    readonly_fields = ['payment', 'action', 'old_status', 'new_status', 'notes', 'performed_by', 'timestamp']
