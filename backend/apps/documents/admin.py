from django.contrib import admin
from .models import Document, Attachment, Activity, RegulatoryBody


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('ref_no', 'doc_type', 'letter_category', 'letter_type', 'department', 'status', 'registered_at')
    search_fields = ('ref_no', 'subject', 'sender_name', 'receiver_name')
    list_filter = ('doc_type', 'letter_category', 'letter_type', 'status', 'department')


@admin.register(RegulatoryBody)
class RegulatoryBodyAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_am', 'created_by', 'created_at')
    search_fields = ('name_en', 'name_am')
    list_filter = ('created_at',)
    readonly_fields = ('created_by', 'created_at')


admin.site.register(Attachment)
admin.site.register(Activity)
