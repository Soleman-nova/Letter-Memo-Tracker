from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Document, Attachment, Activity
from .serializers import DocumentListSerializer, DocumentDetailSerializer, DocumentCreateSerializer, AttachmentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related('department', 'assigned_to', 'created_by')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
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
