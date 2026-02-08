from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


# User role choices
USER_ROLES = [
    ('SUPER_ADMIN', 'Super Admin'),           # Full access + user management
    ('CEO_SECRETARY', 'CEO Secretary'),       # Full access except user management
    ('CXO_SECRETARY', 'CxO Secretary'),       # Edit & view only their department's docs
    ('CEO', 'CEO'),                           # View all documents (read-only)
    ('CXO', 'CxO'),                           # View only their department's docs
]


class Department(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class UserProfile(models.Model):
    """Extended user profile with role and department association"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=USER_ROLES, default='CXO')
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users',
        help_text='Required for CxO and CxO Secretary roles'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    @property
    def is_super_admin(self):
        return self.role == 'SUPER_ADMIN'

    @property
    def is_ceo_secretary(self):
        return self.role == 'CEO_SECRETARY'

    @property
    def is_cxo_secretary(self):
        return self.role == 'CXO_SECRETARY'

    @property
    def is_ceo(self):
        return self.role == 'CEO'

    @property
    def is_cxo(self):
        return self.role == 'CXO'

    @property
    def can_manage_users(self):
        """Only Super Admin can manage users"""
        return self.role == 'SUPER_ADMIN'

    @property
    def can_create_documents(self):
        """Super Admin, CEO Secretary, and CxO Secretary can create documents"""
        return self.role in ['SUPER_ADMIN', 'CEO_SECRETARY', 'CXO_SECRETARY']

    @property
    def can_edit_all_documents(self):
        """Super Admin and CEO Secretary can edit all documents"""
        return self.role in ['SUPER_ADMIN', 'CEO_SECRETARY']

    @property
    def can_view_all_documents(self):
        """Super Admin, CEO Secretary, and CEO can view all documents"""
        return self.role in ['SUPER_ADMIN', 'CEO_SECRETARY', 'CEO']

    def can_view_document(self, document):
        """Check if user can view a specific document"""
        if self.can_view_all_documents:
            return True
        # CxO and CxO Secretary can only view documents related to their department
        if self.department:
            dept_ids = [self.department.id]
            return (
                document.department_id in dept_ids or
                document.co_offices.filter(id__in=dept_ids).exists() or
                document.directed_offices.filter(id__in=dept_ids).exists()
            )
        return False

    def can_edit_document(self, document):
        """Check if user can edit a specific document"""
        if self.can_edit_all_documents:
            return True
        # CxO Secretary can edit documents related to their department
        if self.role == 'CXO_SECRETARY' and self.department:
            dept_ids = [self.department.id]
            return (
                document.department_id in dept_ids or
                document.co_offices.filter(id__in=dept_ids).exists() or
                document.directed_offices.filter(id__in=dept_ids).exists()
            )
        return False


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create UserProfile when a new User is created"""
    if created:
        # Django superusers get SUPER_ADMIN role by default
        role = 'SUPER_ADMIN' if instance.is_superuser else 'CXO'
        UserProfile.objects.create(user=instance, role=role)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Ensure profile is saved when User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
