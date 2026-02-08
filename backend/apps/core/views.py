from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from .models import Department, UserProfile
from .serializers import (
    DepartmentSerializer, UserSerializer, UserCreateSerializer, 
    CurrentUserSerializer, UserProfileSerializer
)


class IsSuperAdmin(permissions.BasePermission):
    """Only Super Admin users can access"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'profile') and request.user.profile.is_super_admin


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all().order_by('code')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserViewSet(viewsets.ModelViewSet):
    """User management - only accessible by Super Admin"""
    queryset = User.objects.all().select_related('profile', 'profile__department')
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.all().select_related('profile', 'profile__department').order_by('username')

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return response.Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Super Admin can reset any user's password"""
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return response.Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password)
        user.save()
        return response.Response({'message': f'Password reset successfully for {user.username}'})


@decorators.api_view(['POST'])
@decorators.permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Allow any authenticated user to change their own password"""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return response.Response(
            {'error': 'Both current_password and new_password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(current_password):
        return response.Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return response.Response(
            {'error': 'New password must be at least 8 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    return response.Response({'message': 'Password changed successfully'})


@decorators.api_view(['GET'])
@decorators.permission_classes([permissions.IsAuthenticated])
def me(request):
    """Get current user with full profile details"""
    u = request.user
    # Ensure profile exists
    if not hasattr(u, 'profile'):
        UserProfile.objects.create(user=u)
    
    profile = u.profile
    return response.Response({
        'id': u.id,
        'username': u.username,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'email': u.email,
        'is_staff': u.is_staff,
        'is_superuser': u.is_superuser,
        'profile': {
            'role': profile.role,
            'role_display': profile.get_role_display(),
            'department': {
                'id': profile.department.id,
                'code': profile.department.code,
                'name': profile.department.name,
            } if profile.department else None,
            'department_name': profile.department.name if profile.department else None,
            'department_code': profile.department.code if profile.department else None,
            'can_manage_users': profile.can_manage_users,
            'can_create_documents': profile.can_create_documents,
            'can_edit_all_documents': profile.can_edit_all_documents,
            'can_view_all_documents': profile.can_view_all_documents,
        }
    })
