from rest_framework import serializers
from django.conf import settings
from django.db import transaction
from .models import Document, Attachment, Activity, NumberSequence, NumberingRule
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
        return obj.actor.get_username() if obj.actor else None


class DocumentListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'ref_no', 'doc_type', 'source', 'subject', 'status', 'registered_at', 'department_name']


class DocumentDetailSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())
    co_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    directed_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    co_office_names = serializers.SerializerMethodField()
    directed_office_names = serializers.SerializerMethodField()
    co_office_name = serializers.SerializerMethodField()
    directed_office_name = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'ref_no', 'doc_type', 'source', 'subject', 'summary', 'sender_name', 'receiver_name', 'status', 'priority', 'confidentiality', 'registered_at', 'received_date', 'written_date', 'memo_date', 'ceo_directed_date', 'due_date', 'ceo_note', 'signature_name', 'company_office_name', 'co_offices', 'co_office_names', 'co_office_name', 'directed_offices', 'directed_office_names', 'directed_office_name', 'department', 'assigned_to', 'prefix', 'sequence', 'ec_year', 'attachments', 'activities']

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


class DocumentCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)
    ec_year = serializers.IntegerField()
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())
    co_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    directed_offices = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), many=True, required=False)
    co_office = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False, write_only=True)
    directed_office = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), allow_null=True, required=False, write_only=True)

    class Meta:
        model = Document
        fields = ['doc_type', 'source', 'subject', 'summary', 'sender_name', 'receiver_name', 'priority', 'confidentiality', 'received_date', 'written_date', 'memo_date', 'ceo_directed_date', 'due_date', 'company_office_name', 'co_offices', 'co_office', 'directed_offices', 'directed_office', 'ceo_note', 'signature_name', 'department', 'ec_year', 'attachments']

    def create(self, validated_data):
        request = self.context['request']
        files = validated_data.pop('attachments', [])
        department = validated_data['department']
        doc_type = validated_data['doc_type']
        ec_year = validated_data['ec_year']

        # Resolve prefix from NumberingRule, fallback to DEFAULT_NUMBER_PREFIX or department.code
        rule = NumberingRule.objects.filter(department=department, doc_type=doc_type, active=True).first()
        prefix = (rule.prefix if rule else (getattr(settings, 'DEFAULT_NUMBER_PREFIX', '') or department.code))

        with transaction.atomic():
            seq_obj, _created = NumberSequence.objects.get_or_create(department=department, doc_type=doc_type, ec_year=ec_year, defaults={'current_value': 0})
            seq_obj = NumberSequence.objects.select_for_update().get(pk=seq_obj.pk)
            seq_obj.current_value += 1
            sequence_value = seq_obj.current_value
            seq_obj.save()

            ref_no = f"{prefix}/{sequence_value}/{str(ec_year).zfill(2)} EC"
            co_offices = list(validated_data.pop('co_offices', []))
            directed_offices = list(validated_data.pop('directed_offices', []))
            single_co = validated_data.pop('co_office', None)
            single_dir = validated_data.pop('directed_office', None)
            document = Document.objects.create(
                ref_no=ref_no,
                prefix=prefix,
                sequence=sequence_value,
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
        
        if not subject:
            raise serializers.ValidationError({'subject': 'Subject is required'})

        # Scenario 1: External Incoming (from outside company to CEO)
        if dt == 'INCOMING' and source == 'EXTERNAL':
            if not attrs.get('received_date'):
                raise serializers.ValidationError({'received_date': 'Received date is required'})
            if not attrs.get('company_office_name'):
                raise serializers.ValidationError({'company_office_name': 'Company/Agency name is required for external incoming'})
        
        # Scenario 2: Internal Incoming (from CxO offices to CEO)
        elif dt == 'INCOMING' and source == 'INTERNAL':
            if not attrs.get('received_date'):
                raise serializers.ValidationError({'received_date': 'Received date is required'})
            if not (attrs.get('co_offices') or attrs.get('co_office')):
                raise serializers.ValidationError({'co_office': 'Originating CxO office is required for internal incoming'})
        
        # Scenario 3: External Outgoing (from CEO to companies/agencies)
        elif dt == 'OUTGOING' and source == 'EXTERNAL':
            if not attrs.get('written_date'):
                raise serializers.ValidationError({'written_date': 'Written date is required'})
            if not attrs.get('company_office_name'):
                raise serializers.ValidationError({'company_office_name': 'Company/Agency name is required for external outgoing'})
        
        # Scenario 4: Internal Outgoing (from CEO to CxO offices)
        elif dt == 'OUTGOING' and source == 'INTERNAL':
            if not attrs.get('written_date'):
                raise serializers.ValidationError({'written_date': 'Written date is required'})
            if not (attrs.get('directed_offices') or attrs.get('directed_office')):
                raise serializers.ValidationError({'directed_office': 'Recipient CxO office(s) required for internal outgoing'})
        
        # Scenario 5: Incoming Memo (from CxO to CEO)
        elif dt == 'MEMO' and source == 'INTERNAL':
            if not attrs.get('memo_date'):
                raise serializers.ValidationError({'memo_date': 'Memo date is required'})
            if not (attrs.get('co_offices') or attrs.get('co_office')):
                raise serializers.ValidationError({'co_office': 'Originating CxO office is required for incoming memos'})
        
        # Scenario 6: Outgoing Memo (from CEO to CxO offices)
        elif dt == 'MEMO' and source == 'EXTERNAL':
            if not attrs.get('memo_date'):
                raise serializers.ValidationError({'memo_date': 'Memo date is required'})
            if not (attrs.get('directed_offices') or attrs.get('directed_office')):
                raise serializers.ValidationError({'directed_office': 'Recipient CxO office(s) required for outgoing memos'})
        
        return attrs
