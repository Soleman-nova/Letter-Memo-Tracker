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
    ('REGISTERED', 'Registered'),
    ('ASSIGNED', 'Assigned'),
    ('IN_PROGRESS', 'In Progress'),
    ('RESPONDED', 'Responded'),
    ('CLOSED', 'Closed'),
]

User = get_user_model()


class NumberingRule(models.Model):
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='numbering_rules')
    doc_type = models.CharField(max_length=20)
    prefix = models.CharField(max_length=50)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('department', 'doc_type')
        verbose_name = 'Numbering Rule'
        verbose_name_plural = 'Numbering Rules'

    def __str__(self):
        return f"{self.department.code} - {self.doc_type}: {self.prefix}"


class NumberSequence(models.Model):
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='number_sequences')
    doc_type = models.CharField(max_length=20)
    ec_year = models.PositiveSmallIntegerField()
    current_value = models.IntegerField(default=0)

    class Meta:
        unique_together = ('department', 'doc_type', 'ec_year')

    def __str__(self):
        return f"{self.department.code}-{self.doc_type}-{self.ec_year}: {self.current_value}"


class Document(models.Model):
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    source = models.CharField(max_length=20, choices=SOURCE_TYPES, default='EXTERNAL')
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='documents')
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_documents')
    prefix = models.CharField(max_length=50, blank=True)
    sequence = models.IntegerField(default=0)
    ec_year = models.PositiveSmallIntegerField()
    ref_no = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=300)
    summary = models.TextField(blank=True)
    # Parties / offices
    company_office_name = models.CharField(max_length=200, blank=True)
    co_offices = models.ManyToManyField(Department, blank=True, related_name='co_office_documents')
    directed_offices = models.ManyToManyField(Department, blank=True, related_name='directed_office_documents')
    sender_name = models.CharField(max_length=200, blank=True)
    receiver_name = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='REGISTERED')
    priority = models.CharField(max_length=20, blank=True)
    confidentiality = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)
    # Dates
    received_date = models.DateField(null=True, blank=True)
    written_date = models.DateField(null=True, blank=True)
    memo_date = models.DateField(null=True, blank=True)
    ceo_directed_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    # Notes / signature
    ceo_note = models.TextField(blank=True)
    signature_name = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='created_documents')

    class Meta:
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.ref_no} - {self.subject}"


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
