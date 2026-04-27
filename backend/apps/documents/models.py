from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import Department

# Module-level constants for choices
DOC_TYPES = [
    ('INCOMING', 'Incoming'),
    ('OUTGOING', 'Outgoing'),
    ('MEMO', 'Memo'),
]

SOURCE_TYPES = [
    ('EXTERNAL', 'External'),
    ('INTERNAL', 'Internal'),
]

STATUSES = [
    ('REGISTERED', 'Registered'),      # Initial entry by CEO secretary
    ('DIRECTED', 'Directed'),          # CEO has read and directed to CxO office(s)
    ('DISPATCHED', 'Dispatched'),      # Letter sent to CxO office(s)
    ('RECEIVED', 'Received'),          # CxO office confirmed receipt
    ('IN_PROGRESS', 'In Progress'),    # Being worked on
    ('RESPONDED', 'Responded'),        # Response sent
    ('CLOSED', 'Closed'),              # Completed
]

PRIORITY_LEVELS = [
    ('LOW', 'Low'),
    ('NORMAL', 'Normal'),
    ('HIGH', 'High'),
    ('URGENT', 'Urgent'),
]

CONFIDENTIALITY_LEVELS = [
    ('REGULAR', 'Regular'),
    ('CONFIDENTIAL', 'Confidential'),
    ('SECRET', 'Secret'),
]

LETTER_CATEGORIES = [
    ('GENERAL', 'General'),
    ('REGULATORY', 'Regulatory'),
]

LETTER_TYPES = [
    ('TECHNICAL', 'Technical'),
    ('LEGAL', 'Legal'),
    ('FINANCIAL', 'Financial'),
    ('ADMINISTRATIVE', 'Administrative'),
    ('GENERAL', 'General'),
]

User = get_user_model()


class Document(models.Model):
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    source = models.CharField(max_length=20, choices=SOURCE_TYPES, default='EXTERNAL')
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='documents', null=True, blank=True)
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_documents')
    prefix = models.CharField(max_length=50, blank=True)
    sequence = models.IntegerField(default=0)
    ref_no = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=300)
    summary = models.TextField(blank=True)
    # Letter categorization
    letter_category = models.CharField(max_length=20, choices=LETTER_CATEGORIES, default='GENERAL')
    letter_type = models.CharField(max_length=20, choices=LETTER_TYPES, default='GENERAL')
    regulatory_body = models.ForeignKey('RegulatoryBody', on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    # Parties / offices
    company_office_name = models.CharField(max_length=200, blank=True)
    co_offices = models.ManyToManyField(Department, blank=True, related_name='co_office_documents')
    cc_offices = models.ManyToManyField(Department, blank=True, related_name='cc_office_documents')
    directed_offices = models.ManyToManyField(Department, blank=True, related_name='directed_office_documents')
    sender_name = models.CharField(max_length=200, blank=True)
    receiver_name = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='REGISTERED')
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='NORMAL', blank=True)
    confidentiality = models.CharField(max_length=20, choices=CONFIDENTIALITY_LEVELS, default='REGULAR', blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    dispatched_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when document status changed to DISPATCHED")
    # Dates
    received_date = models.DateField(null=True, blank=True)
    written_date = models.DateField(null=True, blank=True)
    memo_date = models.DateField(null=True, blank=True)
    ceo_directed_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    # Notes / signature
    ceo_note = models.TextField(blank=True)
    signature_name = models.CharField(max_length=200, blank=True)
    cc_external_names = models.TextField(blank=True)
    requires_ceo_direction = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='created_documents')

    class Meta:
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.ref_no} - {self.subject}"


class RegulatoryBody(models.Model):
    """Model to store regulatory body names for dynamic management"""
    name_en = models.CharField(max_length=200, unique=True)
    name_am = models.CharField(max_length=200, unique=True)
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='created_regulatory_bodies')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name_en']
    
    def __str__(self):
        return self.name_en
    
    def get_localized_name(self, language='en'):
        """Return name based on language"""
        return self.name_am if language == 'am' else self.name_en


class Attachment(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    original_name = models.CharField(max_length=255)
    size = models.BigIntegerField()
    uploaded_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Activity(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='activities')
    actor = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class DocumentAcknowledgment(models.Model):
    """Tracks when CC'd offices acknowledge/see a document (especially for outgoing letters)"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='acknowledgments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='document_acknowledgments')
    acknowledged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='document_acknowledgments')
    acknowledged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('document', 'department')
        ordering = ['-acknowledged_at']

    def __str__(self):
        return f"{self.department.code} acknowledged {self.document.ref_no}"


class DocumentReceipt(models.Model):
    """Tracks when directed CxO offices mark a document as received (for internal outgoing letters)"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='receipts')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='document_receipts')
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='document_receipts')
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('document', 'department')
        ordering = ['-received_at']

    def __str__(self):
        return f"{self.department.code} received {self.document.ref_no}"


class DepartmentPerformanceSnapshot(models.Model):
    """Monthly performance snapshot for departments"""
    METRIC_TYPES = [
        ('receipt', 'Receipt Performance'),
        ('cc_acknowledgment', 'CC Acknowledgment Performance'),
    ]
    
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='performance_snapshots')
    month = models.DateField(help_text="First day of the month")
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    average_hours = models.DecimalField(max_digits=6, decimal_places=2)
    document_count = models.IntegerField()
    rank = models.IntegerField(help_text="Department's rank for that month")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('department', 'month', 'metric_type')
        ordering = ['-month', 'rank']
        indexes = [
            models.Index(fields=['-month', 'metric_type']),
        ]
    
    def __str__(self):
        return f"{self.department.code} - {self.month.strftime('%B %Y')} - {self.metric_type}"
