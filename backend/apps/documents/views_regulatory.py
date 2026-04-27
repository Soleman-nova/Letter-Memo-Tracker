from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RegulatoryBody
from .serializers_regulatory import RegulatoryBodySerializer, RegulatoryBodyListSerializer
from apps.core.models import UserProfile


class CanManageRegulatoryBodies(permissions.BasePermission):
    """Only CEO Secretary can manage regulatory bodies, but all authenticated users can read"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile'):
            UserProfile.objects.create(user=request.user)
        
        # Allow read-only access for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only CEO Secretary can create/update/delete
        return request.user.profile.role == 'CEO_SECRETARY'


class RegulatoryBodyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing regulatory bodies"""
    serializer_class = RegulatoryBodySerializer
    permission_classes = [permissions.IsAuthenticated, CanManageRegulatoryBodies]
    
    def get_queryset(self):
        return RegulatoryBody.objects.all().order_by('name_en')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RegulatoryBodyListSerializer
        return RegulatoryBodySerializer
    
    def perform_create(self, serializer):
        """Set created_by to current user when creating regulatory body"""
        serializer.save(created_by=self.request.user)
