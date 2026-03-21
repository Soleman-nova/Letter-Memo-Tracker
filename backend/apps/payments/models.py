from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import Department

User = get_user_model()

# Payment status choices
PAYMENT_STATUSES = [
    ('ARRIVED', 'Arrived'),           # Letter arrived at CEO office
    ('REGISTERED', 'Registered'),     # Secretary registered with ref_no
    ('PENDING_CEO', 'Pending CEO'),   # Waiting for CEO approval
    ('APPROVED', 'Approved'),         # CEO approved
    ('REJECTED', 'Rejected'),         # CEO rejected
]

# Payment type choices
PAYMENT_TYPES = [
    ('INVOICE', 'Invoice'),
    ('EXPENSE', 'Expense'),
    ('SALARY', 'Salary'),
    ('CONTRACT', 'Contract'),
    ('OTHER', 'Other'),
]

# Currency choices
CURRENCIES = [
    ('ETB', 'Ethiopian Birr'),
    ('USD', 'US Dollar'),
    ('EUR', 'Euro'),
]

# Priority levels
PAYMENT_PRIORITY = [
    ('LOW', 'Low'),
    ('NORMAL', 'Normal'),
    ('HIGH', 'High'),
    ('URGENT', 'Urgent'),
]


class Payment(models.Model):
    """Financial payment tracking model"""
    
    # Registration details
    ref_no = models.CharField(max_length=50, unique=True, null=True, blank=True)
    tt_number = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Optional tracking number")
    arrival_date = models.DateField(help_text="Date letter arrived at CEO office")
    registration_date = models.DateTimeField(auto_now_add=True)
    registered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='registered_payments')
    
    # Payment details
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCIES, default='ETB')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    vendor_name = models.CharField(max_length=200)
    invoice_number = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField()
    payment_date = models.DateField(help_text="Date of payment transaction")
    due_date = models.DateField(null=True, blank=True)
    
    # Workflow
    status = models.CharField(max_length=20, choices=PAYMENT_STATUSES, default='ARRIVED')
    priority = models.CharField(max_length=10, choices=PAYMENT_PRIORITY, default='NORMAL')
    
    # CEO approval
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payments')
    approval_date = models.DateTimeField(null=True, blank=True)
    ceo_notes = models.TextField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        permissions = [
            ('can_register_payment', 'Can register payment'),
            ('can_approve_payment', 'Can approve payment'),
            ('can_view_payment', 'Can view payment'),
        ]
    
    def __str__(self):
        return f"{self.ref_no or 'Unregistered'} - {self.vendor_name} - {self.amount} {self.currency}"
    
    @property
    def is_registered(self):
        return self.ref_no is not None and self.status != 'ARRIVED'
    
    @property
    def needs_ceo_approval(self):
        return self.status == 'PENDING_CEO'
    
    @property
    def is_approved(self):
        return self.status == 'APPROVED'


class PaymentHistory(models.Model):
    """Track payment status changes and actions"""
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50)  # REGISTERED, APPROVED, REJECTED, etc.
    old_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.payment.ref_no} - {self.action} by {self.performed_by}"
