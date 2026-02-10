from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Document, Attachment, Activity, DocumentAcknowledgment, DocumentReceipt
from .serializers import DocumentListSerializer, DocumentDetailSerializer, DocumentCreateSerializer, DocumentUpdateSerializer, AttachmentSerializer
from apps.core.models import UserProfile, Department


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
        source_param = self.request.query_params.get('source')
        if doc_type:
            qs = qs.filter(doc_type=doc_type)
        if source_param:
            qs = qs.filter(source=source_param)
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
        # Date range filtering (YYYY-MM-DD format)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(registered_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(registered_at__date__lte=date_to)
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
        
        scenario = self._get_scenario(document)
        
        # Valid status transitions per scenario
        valid_transitions = {
            1: {'REGISTERED': ['DIRECTED'], 'DIRECTED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            2: {'REGISTERED': ['DIRECTED'], 'DIRECTED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            3: {'REGISTERED': ['CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            4: {'REGISTERED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            5: {'REGISTERED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            6: {'REGISTERED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            7: {'REGISTERED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            8: {'REGISTERED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            9: {'REGISTERED': ['CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            10: {'REGISTERED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            11: {'REGISTERED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            12: {'REGISTERED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            13: {'REGISTERED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
            14: {'REGISTERED': ['DIRECTED'], 'DIRECTED': ['DISPATCHED'], 'DISPATCHED': ['RECEIVED'], 'RECEIVED': ['IN_PROGRESS', 'CLOSED'], 'IN_PROGRESS': ['RESPONDED', 'CLOSED'], 'RESPONDED': ['CLOSED']},
        }
        
        # Validate transition (skip for RECEIVED which is handled by mark_received action)
        if new_status != 'RECEIVED' and scenario in valid_transitions:
            allowed = valid_transitions[scenario].get(document.status, [])
            if new_status not in allowed:
                return Response({
                    'error': f'Cannot transition from {document.status} to {new_status} for this document type. Allowed: {", ".join(allowed) if allowed else "none"}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Dispatch permission checks
        if new_status == 'DISPATCHED':
            # S1, S2, S14: CEO Secretary dispatches after direction
            if scenario in [1, 2, 14]:
                if document.status != 'DIRECTED':
                    return Response({'error': 'Document must be directed before dispatching'}, status=status.HTTP_400_BAD_REQUEST)
                if profile.role not in ['CEO_SECRETARY', 'SUPER_ADMIN']:
                    raise PermissionDenied("Only CEO Secretary can dispatch this document")
            # S4, S6: CEO Secretary dispatches directly from REGISTERED
            elif scenario in [4, 6]:
                if document.status != 'REGISTERED':
                    return Response({'error': 'Document must be in REGISTERED status to dispatch'}, status=status.HTTP_400_BAD_REQUEST)
                if profile.role not in ['CEO_SECRETARY', 'SUPER_ADMIN']:
                    raise PermissionDenied("Only CEO Secretary can dispatch this document")
            # S8, S11, S12: CxO Secretary dispatches from REGISTERED
            elif scenario in [8, 11, 12]:
                if document.status != 'REGISTERED':
                    return Response({'error': 'Document must be in REGISTERED status to dispatch'}, status=status.HTTP_400_BAD_REQUEST)
                if profile.role != 'CXO_SECRETARY':
                    raise PermissionDenied("Only CxO Secretary can dispatch this document")
                # Ensure the dispatching CxO secretary belongs to the originating department
                if profile.department_id != document.department_id:
                    raise PermissionDenied("Only the originating CxO office can dispatch this document")
            # S3, S9: no dispatch needed (outgoing external)
            elif scenario in [3, 9]:
                return Response({'error': 'External outgoing documents do not need dispatching'}, status=status.HTTP_400_BAD_REQUEST)
            # S5, S7, S10, S13: no dispatch step
            elif scenario in [5, 7, 10, 13] and scenario != 14:
                return Response({'error': 'This scenario does not have a dispatch step'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Direction permission check (S1, S2, S14)
        if new_status == 'DIRECTED':
            if scenario not in [1, 2, 14]:
                return Response({'error': 'Only Scenario 1, 2, and 14 documents require CEO direction'}, status=status.HTTP_400_BAD_REQUEST)
            if profile.role not in ['CEO_SECRETARY', 'SUPER_ADMIN']:
                raise PermissionDenied("Only CEO Secretary can direct documents")
        
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
        """Allow CxO Secretary to mark as seen (acknowledge) a CC'd document"""
        document = self.get_object()
        user = request.user
        
        # Ensure profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        profile = user.profile
        
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
            notes=f'{user_dept.code} marked as seen'
        )
        
        return Response({
            'message': 'Document acknowledged successfully',
            'department': user_dept.name,
            'acknowledged_at': ack.acknowledged_at
        }, status=status.HTTP_201_CREATED)

    def _get_scenario(self, document):
        """Determine scenario number for a document"""
        dt = document.doc_type
        src = document.source
        is_ceo_level = document.department is None
        if dt == 'INCOMING' and src == 'EXTERNAL' and is_ceo_level: return 1
        if dt == 'INCOMING' and src == 'INTERNAL' and is_ceo_level: return 2
        if dt == 'OUTGOING' and src == 'EXTERNAL' and is_ceo_level: return 3
        if dt == 'OUTGOING' and src == 'INTERNAL' and is_ceo_level: return 4
        if dt == 'MEMO' and src == 'INTERNAL' and is_ceo_level: return 5
        if dt == 'MEMO' and src == 'EXTERNAL' and is_ceo_level: return 6
        if dt == 'INCOMING' and src == 'EXTERNAL' and not is_ceo_level: return 7
        if dt == 'INCOMING' and src == 'INTERNAL' and not is_ceo_level: return 8
        if dt == 'OUTGOING' and src == 'EXTERNAL' and not is_ceo_level: return 9
        if dt == 'OUTGOING' and src == 'INTERNAL' and not is_ceo_level:
            if getattr(document, 'requires_ceo_direction', False):
                return 14
            return 11 if document.directed_offices.exists() else 10
        if dt == 'MEMO' and src == 'INTERNAL' and not is_ceo_level: return 12
        if dt == 'MEMO' and src == 'EXTERNAL' and not is_ceo_level: return 13
        return 0

    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        """Allow appropriate user to mark a document as received"""
        document = self.get_object()
        user = request.user
        
        # Ensure profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        profile = user.profile
        scenario = self._get_scenario(document)
        
        # Scenarios that don't need receipt
        no_receipt_scenarios = [3, 9]
        if scenario in no_receipt_scenarios or scenario == 0:
            return Response({'error': 'This document type does not require receipt confirmation'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate: document must be dispatched or registered (some scenarios skip dispatch)
        if document.status not in ['DISPATCHED', 'REGISTERED']:
            return Response({'error': 'Document is not in a receivable status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Scenarios where CEO Secretary receives (S5, S10, S13)
        # S2 now has CEO direction + dispatch like S1, so receipt is via directed_offices
        ceo_receives = scenario in [5, 10, 13]
        
        if ceo_receives:
            if profile.role not in ['CEO_SECRETARY', 'SUPER_ADMIN']:
                raise PermissionDenied("Only CEO Secretary can receive this document")
            # Check not already received
            if document.receipts.filter(received_by__profile__role='CEO_SECRETARY').exists():
                return Response({'error': 'CEO Office has already received this document'}, status=status.HTTP_400_BAD_REQUEST)
            # Determine department for receipt: use document's dept, user's dept, or first available dept
            receipt_dept = document.department or profile.department
            if not receipt_dept:
                # For S2/S5 CEO-level docs where CEO Secretary has no dept, use the sending office
                first_co = document.co_offices.first()
                if first_co:
                    receipt_dept = first_co
                else:
                    # Fallback: create without department is not possible due to FK constraint
                    # Use any department as a placeholder
                    receipt_dept = Department.objects.first()
            receipt = DocumentReceipt.objects.create(
                document=document,
                department=receipt_dept,
                received_by=user
            )
            Activity.objects.create(
                document=document, actor=user, action='received',
                notes='CEO Office marked as received'
            )
            document.status = 'RECEIVED'
            document.save()
            Activity.objects.create(
                document=document, actor=user, action='status_changed',
                notes='Status changed to RECEIVED'
            )
            return Response({
                'message': 'Document marked as received',
                'department': 'CEO Office',
                'received_at': receipt.received_at,
                'all_received': True
            }, status=status.HTTP_201_CREATED)
        
        # Scenario 7: self-receive by destination CxO secretary
        if scenario == 7:
            if profile.role != 'CXO_SECRETARY':
                raise PermissionDenied("Only CxO Secretary can receive this document")
            if not profile.department or profile.department_id != document.department_id:
                raise PermissionDenied("Only the destination CxO office can receive this document")
            if document.receipts.filter(department_id=profile.department_id).exists():
                return Response({'error': 'Your department has already received this document'}, status=status.HTTP_400_BAD_REQUEST)
            receipt = DocumentReceipt.objects.create(
                document=document,
                department=profile.department,
                received_by=user
            )
            Activity.objects.create(
                document=document, actor=user, action='received',
                notes=f'{profile.department.code} marked as received'
            )
            document.status = 'RECEIVED'
            document.save()
            Activity.objects.create(
                document=document, actor=user, action='status_changed',
                notes='Status changed to RECEIVED'
            )
            return Response({
                'message': 'Document marked as received',
                'department': profile.department.name,
                'received_at': receipt.received_at,
                'all_received': True
            }, status=status.HTTP_201_CREATED)
        
        # All other scenarios: CxO Secretary receives via directed_offices
        if profile.role != 'CXO_SECRETARY':
            raise PermissionDenied("Only CxO Secretaries can mark documents as received")
        
        if not profile.department:
            return Response({'error': 'Your account is not associated with a department'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_dept = profile.department
        
        if not document.directed_offices.filter(id=user_dept.id).exists():
            raise PermissionDenied("Your department is not a recipient of this document")
        
        if DocumentReceipt.objects.filter(document=document, department=user_dept).exists():
            return Response({'error': 'Your department has already marked this document as received'}, status=status.HTTP_400_BAD_REQUEST)
        
        receipt = DocumentReceipt.objects.create(
            document=document,
            department=user_dept,
            received_by=user
        )
        
        Activity.objects.create(
            document=document, actor=user, action='received',
            notes=f'{user_dept.code} marked as received'
        )
        
        # Check if all directed offices have received
        all_received = not document.directed_offices.exclude(
            id__in=document.receipts.values_list('department_id', flat=True)
        ).exists()
        
        if all_received:
            document.status = 'RECEIVED'
            document.save()
            Activity.objects.create(
                document=document, actor=user, action='status_changed',
                notes='All offices received - status changed to RECEIVED'
            )
        
        return Response({
            'message': 'Document marked as received',
            'department': user_dept.name,
            'received_at': receipt.received_at,
            'all_received': all_received
        }, status=status.HTTP_201_CREATED)
