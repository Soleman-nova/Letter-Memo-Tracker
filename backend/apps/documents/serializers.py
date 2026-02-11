from rest_framework import serializers
from django.conf import settings
from django.db import transaction
from .models import Document, Attachment, Activity, NumberSequence, NumberingRule, DocumentAcknowledgment, DocumentReceipt
from apps.core.models import Department


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'original_name', 'size', 'uploaded_by', 'uploaded_at']


class ActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ['id', 'action', 'notes', 'created_at', 'actor_name']

    def get_actor_name(self, obj):
        if not obj.actor:
            return None
        return obj.actor.get_full_name() or obj.actor.username


class DocumentAcknowledgmentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    acknowledged_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentAcknowledgment
        fields = ['id', 'department', 'department_name', 'department_code', 'acknowledged_by', 'acknowledged_by_name', 'acknowledged_at']
        read_only_fields = ['acknowledged_by', 'acknowledged_at']

    def get_acknowledged_by_name(self, obj):
        if obj.acknowledged_by:
            return obj.acknowledged_by.get_full_name() or obj.acknowledged_by.username
        return None


class DocumentReceiptSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DocumentReceipt
        fields = ['id', 'department', 'department_name', 'department_code', 'received_by', 'received_by_name', 'received_at']
        read_only_fields = ['received_by', 'received_at']

    def get_received_by_name(self, obj):
        if obj.received_by:
            return obj.received_by.get_full_name() or obj.received_by.username
        return None


class DocumentListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)

    class Meta:
        model = Document
        fields = ['id', 'ref_no', 'doc_type', 'source', 'subject', 'status', 'priority', 'registered_at', 'department_name']


class DocumentDetailSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)
    acknowledgments = DocumentAcknowledgmentSerializer(many=True, read_only=True)
    receipts = DocumentReceiptSerializer(many=True, read_only=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False)
    co_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    directed_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    co_office_names = serializers.SerializerMethodField()
    directed_office_names = serializers.SerializerMethodField()
    co_office_name = serializers.SerializerMethodField()
    directed_office_name = serializers.SerializerMethodField()
    pending_acknowledgments = serializers.SerializerMethodField()
    pending_receipts = serializers.SerializerMethodField()
    user_can_acknowledge = serializers.SerializerMethodField()
    user_can_receive = serializers.SerializerMethodField()
    scenario = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    department_code = serializers.CharField(source='department.code', read_only=True, default=None)

    class Meta:
        model = Document
        fields = ['id', 'ref_no', 'doc_type', 'source', 'subject', 'summary', 'sender_name', 'receiver_name', 'status', 'priority', 'confidentiality', 'registered_at', 'received_date', 'written_date', 'memo_date', 'ceo_directed_date', 'due_date', 'ceo_note', 'signature_name', 'company_office_name', 'cc_external_names', 'co_offices', 'co_office_names', 'co_office_name', 'directed_offices', 'directed_office_names', 'directed_office_name', 'department', 'department_name', 'department_code', 'assigned_to', 'prefix', 'sequence', 'ec_year', 'requires_ceo_direction', 'attachments', 'activities', 'acknowledgments', 'pending_acknowledgments', 'receipts', 'pending_receipts', 'user_can_acknowledge', 'user_can_receive', 'scenario']

    def get_scenario(self, obj):
        return self._get_scenario(obj)

    def get_co_office_names(self, obj):
        return list(obj.co_offices.values_list('name', flat=True))

    def get_directed_office_names(self, obj):
        return list(obj.directed_offices.values_list('name', flat=True))

    def get_co_office_name(self, obj):
        names = self.get_co_office_names(obj)
        return ', '.join(names) if names else None

    def get_directed_office_name(self, obj):
        names = self.get_directed_office_names(obj)
        return ', '.join(names) if names else None

    def _get_scenario(self, obj):
        """Determine which scenario this document belongs to based on doc_type, source, and department"""
        dt = obj.doc_type
        src = obj.source
        dept = obj.department
        # CEO-level: department is None or user is CEO Secretary
        is_ceo_level = dept is None
        if dt == 'INCOMING' and src == 'EXTERNAL' and is_ceo_level:
            return 1
        if dt == 'INCOMING' and src == 'INTERNAL' and is_ceo_level:
            return 2
        if dt == 'OUTGOING' and src == 'EXTERNAL' and is_ceo_level:
            return 3
        if dt == 'OUTGOING' and src == 'INTERNAL' and is_ceo_level:
            return 4
        if dt == 'MEMO' and is_ceo_level:
            if obj.co_offices.exists():
                return 5  # CxO to CEO (incoming memo, may have directed_offices for forwarding)
            return 6  # CEO to CxO offices (outgoing memo)
        if dt == 'INCOMING' and src == 'EXTERNAL' and not is_ceo_level:
            return 7
        if dt == 'INCOMING' and src == 'INTERNAL' and not is_ceo_level:
            return 8
        if dt == 'OUTGOING' and src == 'EXTERNAL' and not is_ceo_level:
            return 9
        if dt == 'OUTGOING' and src == 'INTERNAL' and not is_ceo_level:
            # S14: CxO-to-CEO with CEO direction
            if getattr(obj, 'requires_ceo_direction', False):
                return 14
            # Could be S10 (CxO-to-CEO) or S11 (CxO-to-CxO)
            # S10: directed_offices is empty (goes to CEO)
            # S11: directed_offices has CxO offices
            if obj.directed_offices.exists():
                return 11
            return 10
        if dt == 'MEMO' and not is_ceo_level:
            if obj.directed_offices.exists():
                return 12  # CxO to other CxO
            return 13  # CxO to CEO
        return 0

    def _needs_receipt(self, scenario):
        """Scenarios that require receipt tracking"""
        return scenario in [1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14]

    def _s5_has_directed(self, obj):
        """Check if S5 memo has directed offices (forwarding workflow)"""
        return obj.directed_offices.exists()

    def _needs_acknowledgment(self, scenario):
        """Scenarios that require CC acknowledgment (mark as seen)"""
        return scenario in [1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 14]

    def _receipt_by_ceo_secretary(self, scenario, obj=None):
        """Scenarios where CEO Secretary is the receiver"""
        if scenario == 5 and obj and self._s5_has_directed(obj):
            return False  # S5 with directed offices: CxO offices receive, not CEO
        return scenario in [5, 10, 13]

    def get_pending_acknowledgments(self, obj):
        """Returns list of CC'd offices that haven't acknowledged yet"""
        scenario = self._get_scenario(obj)
        if not self._needs_acknowledgment(scenario):
            return []
        if not obj.co_offices.exists():
            return []
        acknowledged_dept_ids = set(obj.acknowledgments.values_list('department_id', flat=True))
        pending = obj.co_offices.exclude(id__in=acknowledged_dept_ids)
        return [{'id': d.id, 'name': d.name, 'code': d.code} for d in pending]

    def get_user_can_acknowledge(self, obj):
        """Check if the current user can acknowledge (mark as seen) this document"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        scenario = self._get_scenario(obj)
        if not self._needs_acknowledgment(scenario):
            return False
        user = request.user
        if not hasattr(user, 'profile') or not user.profile.department:
            return False
        if user.profile.role != 'CXO_SECRETARY':
            return False
        user_dept_id = user.profile.department_id
        is_cc_office = obj.co_offices.filter(id=user_dept_id).exists()
        already_acknowledged = obj.acknowledgments.filter(department_id=user_dept_id).exists()
        return is_cc_office and not already_acknowledged

    def get_user_can_receive(self, obj):
        """Check if the current user can mark this document as received"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.status not in ['DISPATCHED', 'REGISTERED']:
            return False
        user = request.user
        if not hasattr(user, 'profile'):
            return False
        profile = user.profile
        scenario = self._get_scenario(obj)
        if not self._needs_receipt(scenario):
            return False
        # Already fully received
        if obj.status == 'RECEIVED':
            return False
        # Scenarios where CEO Secretary receives
        if self._receipt_by_ceo_secretary(scenario, obj):
            if profile.role not in ['CEO_SECRETARY', 'SUPER_ADMIN']:
                return False
            # Check not already received by CEO secretary
            already_received = obj.receipts.filter(received_by__profile__role='CEO_SECRETARY').exists()
            return not already_received
        # Scenario 7: self-receive by destination CxO secretary
        if scenario == 7:
            if profile.role != 'CXO_SECRETARY':
                return False
            if not profile.department or profile.department_id != obj.department_id:
                return False
            already_received = obj.receipts.filter(department_id=profile.department_id).exists()
            return not already_received
        # Scenarios where CxO Secretary receives (directed offices)
        if profile.role != 'CXO_SECRETARY':
            return False
        if not profile.department:
            return False
        user_dept_id = profile.department_id
        is_directed = obj.directed_offices.filter(id=user_dept_id).exists()
        already_received = obj.receipts.filter(department_id=user_dept_id).exists()
        return is_directed and not already_received

    def get_pending_receipts(self, obj):
        """Returns list of offices that haven't marked as received yet"""
        scenario = self._get_scenario(obj)
        if not self._needs_receipt(scenario):
            return []
        received_dept_ids = set(obj.receipts.values_list('department_id', flat=True))
        # Scenarios where CEO Secretary receives - show CEO office as pending
        if self._receipt_by_ceo_secretary(scenario, obj):
            if not obj.receipts.filter(received_by__profile__role='CEO_SECRETARY').exists():
                return [{'id': 0, 'name': 'CEO Office', 'code': 'CEO'}]
            return []
        # Scenario 7: self-receive
        if scenario == 7:
            if not obj.receipts.filter(department_id=obj.department_id).exists():
                dept = obj.department
                return [{'id': dept.id, 'name': dept.name, 'code': dept.code}] if dept else []
            return []
        # Directed offices pending
        pending = obj.directed_offices.exclude(id__in=received_dept_ids)
        return [{'id': d.id, 'name': d.name, 'code': d.code} for d in pending]


class DocumentCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)
    ec_year = serializers.IntegerField()
    ref_no = serializers.CharField(max_length=100)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    co_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    directed_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    co_office = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False, write_only=True)
    directed_office = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False, write_only=True)

    class Meta:
        model = Document
        fields = ['id', 'ref_no', 'doc_type', 'source', 'subject', 'summary', 'sender_name', 'receiver_name', 'priority', 'confidentiality', 'received_date', 'written_date', 'memo_date', 'ceo_directed_date', 'due_date', 'company_office_name', 'cc_external_names', 'co_offices', 'co_office', 'directed_offices', 'directed_office', 'ceo_note', 'signature_name', 'department', 'ec_year', 'requires_ceo_direction', 'attachments', 'status']
        read_only_fields = ['id', 'status']

    def create(self, validated_data):
        request = self.context['request']
        files = validated_data.pop('attachments', [])
        ref_no = validated_data.pop('ref_no')

        with transaction.atomic():
            co_offices = list(validated_data.pop('co_offices', []))
            directed_offices = list(validated_data.pop('directed_offices', []))
            single_co = validated_data.pop('co_office', None)
            single_dir = validated_data.pop('directed_office', None)
            document = Document.objects.create(
                ref_no=ref_no,
                created_by=request.user if request.user.is_authenticated else None,
                status='REGISTERED',
                **validated_data
            )
            if single_co:
                co_offices.append(single_co)
            if single_dir:
                directed_offices.append(single_dir)
            if co_offices:
                document.co_offices.set(co_offices)
            if directed_offices:
                document.directed_offices.set(directed_offices)

        for f in files:
            Attachment.objects.create(
                document=document,
                file=f,
                original_name=getattr(f, 'name', ''),
                size=getattr(f, 'size', 0),
                uploaded_by=request.user if request.user.is_authenticated else None
            )
        Activity.objects.create(document=document, actor=request.user if request.user.is_authenticated else None, action='created', notes='Document registered')
        return document

    def validate(self, attrs):
        dt = attrs.get('doc_type')
        source = attrs.get('source', 'EXTERNAL')
        subject = attrs.get('subject')
        ref_no = attrs.get('ref_no')
        has_dept = attrs.get('department') is not None  # CxO-level if department is set
        
        if not ref_no:
            raise serializers.ValidationError({'ref_no': 'Reference number is required'})
        
        # Check for duplicate ref_no
        if Document.objects.filter(ref_no=ref_no).exists():
            raise serializers.ValidationError({'ref_no': 'A document with this reference number already exists'})
        
        if not subject:
            raise serializers.ValidationError({'subject': 'Subject is required'})

        # === CEO-level scenarios (1-6): no department set ===
        if not has_dept:
            if dt == 'INCOMING' and source == 'EXTERNAL':
                # S1
                if not attrs.get('received_date'):
                    raise serializers.ValidationError({'received_date': 'Received date is required'})
                if not attrs.get('company_office_name'):
                    raise serializers.ValidationError({'company_office_name': 'Company/Agency name is required'})
            elif dt == 'INCOMING' and source == 'INTERNAL':
                # S2
                if not attrs.get('received_date'):
                    raise serializers.ValidationError({'received_date': 'Received date is required'})
                if not (attrs.get('co_offices') or attrs.get('co_office')):
                    raise serializers.ValidationError({'co_office': 'Originating CxO office is required'})
            elif dt == 'OUTGOING' and source == 'EXTERNAL':
                # S3
                if not attrs.get('written_date'):
                    raise serializers.ValidationError({'written_date': 'Written date is required'})
                if not attrs.get('company_office_name'):
                    raise serializers.ValidationError({'company_office_name': 'Company/Agency name is required'})
            elif dt == 'OUTGOING' and source == 'INTERNAL':
                # S4
                if not attrs.get('written_date'):
                    raise serializers.ValidationError({'written_date': 'Written date is required'})
                if not (attrs.get('directed_offices') or attrs.get('directed_office')):
                    raise serializers.ValidationError({'directed_office': 'Recipient CxO office(s) required'})
            elif dt == 'MEMO' and source == 'INTERNAL':
                # S5
                if not attrs.get('memo_date'):
                    raise serializers.ValidationError({'memo_date': 'Memo date is required'})
                if not (attrs.get('co_offices') or attrs.get('co_office')):
                    raise serializers.ValidationError({'co_office': 'Originating CxO office is required'})
            elif dt == 'MEMO' and source == 'EXTERNAL':
                # S6
                if not attrs.get('memo_date'):
                    raise serializers.ValidationError({'memo_date': 'Memo date is required'})
                if not (attrs.get('directed_offices') or attrs.get('directed_office')):
                    raise serializers.ValidationError({'directed_office': 'Recipient CxO office(s) required'})
        # === CxO-level scenarios (7-13): department is set ===
        else:
            if dt == 'INCOMING' and source == 'EXTERNAL':
                # S7
                if not attrs.get('received_date'):
                    raise serializers.ValidationError({'received_date': 'Received date is required'})
                if not attrs.get('company_office_name'):
                    raise serializers.ValidationError({'company_office_name': 'Company/Agency name is required'})
            elif dt == 'INCOMING' and source == 'INTERNAL':
                # S8
                if not attrs.get('received_date'):
                    raise serializers.ValidationError({'received_date': 'Received date is required'})
            elif dt == 'OUTGOING' and source == 'EXTERNAL':
                # S9
                if not attrs.get('written_date'):
                    raise serializers.ValidationError({'written_date': 'Written date is required'})
                if not attrs.get('company_office_name'):
                    raise serializers.ValidationError({'company_office_name': 'Company/Agency name is required'})
            elif dt == 'OUTGOING' and source == 'INTERNAL':
                # S10, S11, or S14
                if not attrs.get('written_date'):
                    raise serializers.ValidationError({'written_date': 'Written date is required'})
            elif dt == 'MEMO' and source == 'INTERNAL':
                # S12
                if not attrs.get('memo_date'):
                    raise serializers.ValidationError({'memo_date': 'Memo date is required'})
            elif dt == 'MEMO' and source == 'EXTERNAL':
                # S13
                if not attrs.get('memo_date'):
                    raise serializers.ValidationError({'memo_date': 'Memo date is required'})
        
        return attrs


class DocumentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating documents - used for status progression workflow"""
    co_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    directed_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)

    class Meta:
        model = Document
        fields = [
            'status', 'ceo_directed_date', 'ceo_note', 'directed_offices', 'co_offices',
            'subject', 'summary', 'company_office_name', 'cc_external_names', 'received_date', 'written_date',
            'memo_date', 'due_date', 'signature_name', 'priority', 'confidentiality'
        ]

    def update(self, instance, validated_data):
        co_offices = validated_data.pop('co_offices', None)
        directed_offices = validated_data.pop('directed_offices', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if co_offices is not None:
            instance.co_offices.set(co_offices)
        if directed_offices is not None:
            instance.directed_offices.set(directed_offices)
        
        # Log activity
        Activity.objects.create(
            document=instance,
            actor=self.context['request'].user if self.context['request'].user.is_authenticated else None,
            action='updated',
            notes='Document updated'
        )
        return instance
