from django.contrib import admin
from .models import Document, Attachment, Activity, NumberSequence, NumberingRule


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('ref_no', 'doc_type', 'department', 'status', 'registered_at')
    search_fields = ('ref_no', 'subject', 'sender_name', 'receiver_name')
    list_filter = ('doc_type', 'status', 'department')


admin.site.register(Attachment)
admin.site.register(Activity)
admin.site.register(NumberSequence)
admin.site.register(NumberingRule)
