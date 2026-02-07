from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Document, Attachment, Activity, DocumentAcknowledgment
from .serializers import DocumentListSerializer, DocumentDetailSerializer, DocumentCreateSerializer, DocumentUpdateSerializer, AttachmentSerializer
from apps.core.models import UserProfile


class CanCreateDocument(permissions.BasePermission):
    """Only Super Admin and CEO Secretary can create documents"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'profile'):
            UserProfile.objects.create(user=request.user)
        # Only apply create restriction to the 'create' action
        if view.action == 'create':
            return request.user.profile.can_create_documents
        # Allow other actions (update_status, attachments, etc.) - they have their own checks
        return True


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related('department', 'assigned_to', 'created_by')
    permission_classes = [permissions.IsAuthenticated, CanCreateDocument]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Ensure profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        profile = user.profile
        
        # Filter based on role
        if profile.can_view_all_documents:
            # Super Admin, CEO Secretary, CEO can see all
            pass
        elif profile.department:
            # CxO and CxO Secretary can only see documents related to their department
            dept_id = profile.department_id
            qs = qs.filter(
                Q(department_id=dept_id) |
                Q(co_offices__id=dept_id) |
                Q(directed_offices__id=dept_id)
            ).distinct()
        q = self.request.query_params.get('q')
        doc_type = self.request.query_params.get('doc_type')
        status_param = self.request.query_params.get('status')
        department = self.request.query_params.get('department')
        # Office filters (supports comma-separated single param or repeated params)
        co_office_param = self.request.query_params.get('co_office')
        directed_office_param = self.request.query_params.get('directed_office')
        co_offices_list = self.request.query_params.getlist('co_offices')
        directed_offices_list = self.request.query_params.getlist('directed_offices')
        if q:
            qs = qs.filter(Q(ref_no__icontains=q) | Q(subject__icontains=q) | Q(sender_name__icontains=q) | Q(receiver_name__icontains=q))
        if doc_type:
            qs = qs.filter(doc_type=doc_type)
        if status_param:
            qs = qs.filter(status=status_param)
        if department:
            qs = qs.filter(department_id=department)
        co_ids = []
        dir_ids = []
        if co_office_param:
            co_ids.extend([x for x in (co_office_param or '').split(',') if x])
        if directed_office_param:
            dir_ids.extend([x for x in (directed_office_param or '').split(',') if x])
        if co_offices_list:
            co_ids.extend([x for x in co_offices_list if x])
        if directed_offices_list:
            dir_ids.extend([x for x in directed_offices_list if x])
        if co_ids:
            qs = qs.filter(co_offices__id__in=co_ids)
        if dir_ids:
            qs = qs.filter(directed_offices__id__in=dir_ids)
        if co_ids or dir_ids:
            qs = qs.distinct()
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        if self.action == 'create':
            return DocumentCreateSerializer
        if self.action in ['update', 'partial_update']:
            return DocumentUpdateSerializer
        return DocumentDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        """Check view permission before retrieving"""
        instance = self.get_object()
        profile = request.user.profile
        if not profile.can_view_document(instance):
            raise PermissionDenied("You don't have permission to view this document")
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Check edit permission before updating"""
        instance = self.get_object()
        profile = request.user.profile
        if not profile.can_edit_document(instance):
            raise PermissionDenied("You don't have permission to edit this document")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Check edit permission before partial updating"""
        instance = self.get_object()
        profile = request.user.profile
        if not profile.can_edit_document(instance):
            raise PermissionDenied("You don't have permission to edit this document")
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only Super Admin and CEO Secretary can delete documents"""
        profile = request.user.profile
        if not profile.can_edit_all_documents:
            raise PermissionDenied("You don't have permission to delete documents")
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def attachments(self, request, pk=None):
        document = self.get_object()
        files = request.FILES.getlist('files')
        created = []
        for f in files:
            att = Attachment.objects.create(
                document=document,
                file=f,
                original_name=getattr(f, 'name', ''),
                size=getattr(f, 'size', 0),
                uploaded_by=request.user if request.user.is_authenticated else None
            )
            created.append(AttachmentSerializer(att, context={'request': request}).data)
        Activity.objects.create(document=document, actor=request.user if request.user.is_authenticated else None, action='attachment_added', notes=f'{len(created)} file(s) added')
        return Response(created, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        document = self.get_object()
        profile = request.user.profile
        
        # Check if user can edit this document
        if not profile.can_edit_document(document):
            raise PermissionDenied("You don't have permission to update this document's status")
        
        new_status = request.data.get('status')
        valid_statuses = ['REGISTERED', 'DIRECTED', 'DISPATCHED', 'RECEIVED', 'IN_PROGRESS', 'RESPONDED', 'CLOSED']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = document.status
        document.status = new_status
        document.save()
        Activity.objects.create(
            document=document,
            actor=request.user if request.user.is_authenticated else None,
            action='status_changed',
            notes=f'Status changed from {old_status} to {new_status}'
        )
        return Response({'status': new_status})

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Allow CxO Secretary to acknowledge they have seen an outgoing letter"""
        document = self.get_object()
        user = request.user
        
        # Ensure profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        profile = user.profile
        
        # Validate: must be outgoing letter
        if document.doc_type != 'OUTGOING':
            return Response({'error': 'Only outgoing letters can be acknowledged'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate: user must be CxO Secretary
        if profile.role != 'CXO_SECRETARY':
            raise PermissionDenied("Only CxO Secretaries can acknowledge documents")
        
        # Validate: user must have a department
        if not profile.department:
            return Response({'error': 'Your account is not associated with a department'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_dept = profile.department
        
        # Validate: user's department must be in CC offices
        if not document.co_offices.filter(id=user_dept.id).exists():
            raise PermissionDenied("Your department is not CC'd on this document")
        
        # Check if already acknowledged
        if DocumentAcknowledgment.objects.filter(document=document, department=user_dept).exists():
            return Response({'error': 'Your department has already acknowledged this document'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create acknowledgment
        ack = DocumentAcknowledgment.objects.create(
            document=document,
            department=user_dept,
            acknowledged_by=user
        )
        
        # Log activity
        Activity.objects.create(
            document=document,
            actor=user,
            action='acknowledged',
            notes=f'{user_dept.code} acknowledged receipt'
        )
        
        return Response({
            'message': 'Document acknowledged successfully',
            'department': user_dept.name,
            'acknowledged_at': ack.acknowledged_at
        }, status=status.HTTP_201_CREATED)
