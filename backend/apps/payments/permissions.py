from rest_framework import permissions


class IsCEO(permissions.BasePermission):
    """Only allows access to CEO users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'CEO'
        )


class IsCEOSecretary(permissions.BasePermission):
    """Only allows access to CEO Secretary users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'CEO_SECRETARY'
        )


class IsCxOSecretary(permissions.BasePermission):
    """Only allows access to CxO Secretary users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'CXO_SECRETARY'
        )


class IsCxO(permissions.BasePermission):
    """Only allows access to CxO users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'CXO'
        )


class IsSuperAdmin(permissions.BasePermission):
    """Only allows access to Super Admin users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'SUPER_ADMIN'
        )


class IsCEOOrCEOSecretary(permissions.BasePermission):
    """Allows access to CEO or CEO Secretary users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role in ['CEO', 'CEO_SECRETARY', 'SUPER_ADMIN']
        )


class IsCEOOrCEOSecretaryOrCxOSecretary(permissions.BasePermission):
    """Allows access to CEO, CEO Secretary, or CxO Secretary users"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role in ['CEO', 'CEO_SECRETARY', 'CXO_SECRETARY', 'SUPER_ADMIN']
        )


class IsCxOFinance(permissions.BasePermission):
    """Only allows access to CxO users in Finance department"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'CXO' and
            hasattr(request.user.profile, 'department') and
            request.user.profile.department and
            request.user.profile.department.code == 'Finance'
        )
