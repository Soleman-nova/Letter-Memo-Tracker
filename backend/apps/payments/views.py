from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Payment, PaymentHistory
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentUpdateSerializer, 
    PaymentApprovalSerializer, PaymentHistorySerializer
)
from .permissions import IsCEO, IsCEOSecretary


class PaymentViewSet(viewsets.ModelViewSet):
    """Payment management viewset"""
    queryset = Payment.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PaymentUpdateSerializer
        elif self.action == 'approve':
            return PaymentApprovalSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        """Filter payments based on user role and query parameters"""
        user = self.request.user
        queryset = Payment.objects.all()
        
        # Role-based filtering
        if IsCEO().has_permission(self.request, self):
            queryset = queryset.exclude(status='ARRIVED')
        elif IsCEOSecretary().has_permission(self.request, self):
            pass  # Can see all payments
        else:
            queryset = queryset.filter(status='APPROVED')
        
        # Manual filtering based on query parameters
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        payment_type = self.request.query_params.get('payment_type')
        if payment_type:
            queryset = queryset.filter(payment_type=payment_type)
            
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
            
        currency = self.request.query_params.get('currency')
        if currency:
            queryset = queryset.filter(currency=currency)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set registered_by to current user"""
        serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCEO])
    def approve(self, request, pk=None):
        """CEO approval/rejection endpoint"""
        payment = self.get_object()
        
        if payment.status not in ['REGISTERED', 'PENDING_CEO']:
            return Response(
                {'error': 'Payment cannot be approved in current status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(payment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCEOSecretary])
    def mark_pending_ceo(self, request, pk=None):
        """Mark payment as pending CEO review"""
        payment = self.get_object()
        
        if payment.status != 'REGISTERED':
            return Response(
                {'error': 'Only registered payments can be marked as pending CEO'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.status = 'PENDING_CEO'
        payment.save()
        
        # Create history record
        PaymentHistory.objects.create(
            payment=payment,
            action='MARKED_PENDING_CEO',
            old_status='REGISTERED',
            new_status='PENDING_CEO',
            notes='Payment marked as pending CEO review',
            performed_by=request.user
        )
        
        return Response({'status': 'Payment marked as pending CEO review'})
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def history(self, request, pk=None):
        """Get payment history"""
        payment = self.get_object()
        history = payment.history.all()
        serializer = PaymentHistorySerializer(history, many=True)
        return Response(serializer.data)


class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Payment history viewset"""
    queryset = PaymentHistory.objects.all()
    serializer_class = PaymentHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter history by payment if payment_id is provided"""
        payment_id = self.request.query_params.get('payment_id')
        if payment_id:
            return PaymentHistory.objects.filter(payment_id=payment_id)
        return PaymentHistory.objects.all()
