from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Payment, PaymentHistory, PAYMENT_STATUSES, PAYMENT_TYPES, CURRENCIES, PAYMENT_PRIORITY

User = get_user_model()


class PaymentSerializer(serializers.ModelSerializer):
    """Base payment serializer"""
    registered_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'ref_no', 'tt_number', 'arrival_date', 'registration_date', 'registered_by', 'registered_by_name',
            'amount', 'currency', 'payment_type', 'payment_type_display', 'vendor_name', 'invoice_number', 
            'description', 'payment_date', 'due_date', 'status', 'status_display', 'priority', 'priority_display',
            'approved_by', 'approved_by_name', 'approval_date', 'ceo_notes',
            'created_at', 'updated_at', 'is_registered', 'needs_ceo_approval', 'is_approved'
        ]
        read_only_fields = ['registration_date', 'registered_by', 'approved_by', 'approval_date', 'created_at', 'updated_at']
    
    def get_registered_by_name(self, obj):
        if obj.registered_by:
            return f"{obj.registered_by.first_name} {obj.registered_by.last_name}".strip() or obj.registered_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class PaymentCreateSerializer(PaymentSerializer):
    """Serializer for CEO Secretary to register new payment"""
    
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields
        read_only_fields = PaymentSerializer.Meta.read_only_fields + ['status']
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['registered_by'] = user
        validated_data['status'] = 'REGISTERED' if validated_data.get('ref_no') else 'ARRIVED'
        
        payment = super().create(validated_data)
        
        # Create history record
        PaymentHistory.objects.create(
            payment=payment,
            action='REGISTERED' if payment.is_registered else 'ARRIVED',
            new_status=payment.status,
            notes=f"Payment {'registered' if payment.is_registered else 'recorded as arrived'}",
            performed_by=user
        )
        
        return payment


class PaymentUpdateSerializer(PaymentSerializer):
    """Serializer for updating payment details (before CEO approval)"""
    
    class Meta(PaymentSerializer.Meta):
        fields = [
            'ref_no', 'tt_number', 'arrival_date', 'amount', 'currency', 'payment_type',
            'vendor_name', 'invoice_number', 'description', 'payment_date', 'due_date', 'priority'
        ]
        read_only_fields = []
    
    def update(self, instance, validated_data):
        user = self.context['request'].user
        old_status = instance.status
        
        # Check if ref_no is being added (marking as registered)
        if not instance.ref_no and validated_data.get('ref_no'):
            validated_data['status'] = 'REGISTERED'
        
        instance = super().update(instance, validated_data)
        
        # Create history record if status changed
        if old_status != instance.status:
            PaymentHistory.objects.create(
                payment=instance,
                action='STATUS_CHANGED',
                old_status=old_status,
                new_status=instance.status,
                notes=f"Status changed from {old_status} to {instance.status}",
                performed_by=user
            )
        
        return instance


class PaymentApprovalSerializer(serializers.ModelSerializer):
    """Serializer for CEO approval/rejection"""
    
    class Meta:
        model = Payment
        fields = ['status', 'ceo_notes']
    
    def validate_status(self, value):
        if value not in ['APPROVED', 'REJECTED']:
            raise serializers.ValidationError("Status must be APPROVED or REJECTED")
        return value
    
    def update(self, instance, validated_data):
        user = self.context['request'].user
        old_status = instance.status
        
        instance.status = validated_data['status']
        instance.approved_by = user
        instance.approval_date = timezone.now()
        instance.ceo_notes = validated_data.get('ceo_notes', '')
        instance.save()
        
        # Create history record
        PaymentHistory.objects.create(
            payment=instance,
            action=instance.status,
            old_status=old_status,
            new_status=instance.status,
            notes=instance.ceo_notes or f"Payment {instance.status.lower()}",
            performed_by=user
        )
        
        return instance


class PaymentHistorySerializer(serializers.ModelSerializer):
    """Serializer for payment history"""
    performed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentHistory
        fields = ['id', 'action', 'old_status', 'new_status', 'notes', 'performed_by', 'performed_by_name', 'timestamp']
        read_only_fields = ['payment']
    
    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return f"{obj.performed_by.first_name} {obj.performed_by.last_name}".strip() or obj.performed_by.username
        return None
