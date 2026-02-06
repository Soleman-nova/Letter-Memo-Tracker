from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'active')
    search_fields = ('code', 'name')
    list_filter = ('active',)
