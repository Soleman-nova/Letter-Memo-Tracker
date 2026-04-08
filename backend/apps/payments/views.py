from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Payment, PaymentHistory
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentUpdateSerializer,
    PaymentHistorySerializer
)
from .permissions import IsCEO, IsCEOSecretary, IsCEOOrCEOSecretary, IsCxOFinance


class PaymentViewSet(viewsets.ModelViewSet):
    """Payment management viewset"""
    queryset = Payment.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PaymentUpdateSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        """Filter payments based on user role and query parameters"""
        user = self.request.user
        queryset = Payment.objects.all()
        
        # Role-based filtering
        if IsCEO().has_permission(self.request, self):
            # CEO should not see ARRIVED payments
            queryset = queryset.exclude(status='ARRIVED')
        elif IsCEOSecretary().has_permission(self.request, self):
            pass  # Can see all payments
        elif IsCxOFinance().has_permission(self.request, self):
            pass  # CxO Finance can see all payments
        else:
            # Other users only see completed payments
            queryset = queryset.filter(status='PAYMENT_COMPLETE')
        
        # Manual filtering based on query parameters
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(temp_ref_no__icontains=search) |
                Q(ref_no__icontains=search) |
                Q(tt_number__icontains=search) |
                Q(vendor_name__icontains=search) |
                Q(invoice_number__icontains=search) |
                Q(description__icontains=search) |
                Q(amount__icontains=search)
            )

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

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def history(self, request, pk=None):
        """Get payment history"""
        payment = self.get_object()
        history = payment.history.all()
        serializer = PaymentHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCEOSecretary])
    def mark_pending_payment(self, request, pk=None):
        """Mark payment as pending (CEO Secretary only)"""
        payment = self.get_object()
        
        if payment.status != 'ARRIVED':
            return Response(
                {'error': 'Payment must be in ARRIVED status to mark as pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = payment.status
        payment.status = 'PENDING_PAYMENT'
        payment.pending_payment_by = request.user
        payment.pending_payment_date = timezone.now()
        payment.save()
        
        # Create history record
        PaymentHistory.objects.create(
            payment=payment,
            action='MARKED_PENDING',
            old_status=old_status,
            new_status='PENDING_PAYMENT',
            performed_by=request.user
        )
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCxOFinance])
    def mark_transferred(self, request, pk=None):
        """Mark payment as transferred to bank (CxO Finance only)"""
        payment = self.get_object()
        
        if payment.status != 'PENDING_PAYMENT':
            return Response(
                {'error': 'Payment must be in PENDING_PAYMENT status to transfer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = payment.status
        payment.status = 'TRANSFERRED_TO_BANK'
        payment.transferred_by = request.user
        payment.transferred_date = timezone.now()
        payment.save()
        
        # Create history record
        PaymentHistory.objects.create(
            payment=payment,
            action='TRANSFERRED_TO_BANK',
            old_status=old_status,
            new_status='TRANSFERRED_TO_BANK',
            performed_by=request.user
        )
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCxOFinance])
    def mark_completed(self, request, pk=None):
        """Mark payment as completed (CxO Finance only)"""
        payment = self.get_object()
        
        if payment.status != 'TRANSFERRED_TO_BANK':
            return Response(
                {'error': 'Payment must be in TRANSFERRED_TO_BANK status to complete'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = payment.status
        payment.status = 'PAYMENT_COMPLETE'
        payment.completed_by = request.user
        payment.completed_date = timezone.now()
        payment.save()
        
        # Create history record
        PaymentHistory.objects.create(
            payment=payment,
            action='PAYMENT_COMPLETED',
            old_status=old_status,
            new_status='PAYMENT_COMPLETE',
            performed_by=request.user
        )
        
        serializer = self.get_serializer(payment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def monthly_summary(self, request):
        """Return monthly payment totals and counts for a given year/month.
        Includes all payments with official ref (excludes ARRIVED status only).
        Accessible by CEO, CEO Secretary, and CxO Finance."""
        # Check if user has permission to view reports
        if not (IsCEO().has_permission(request, self) or 
                IsCEOSecretary().has_permission(request, self) or 
                IsCxOFinance().has_permission(request, self)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to view payment reports.")
        year = int(request.query_params.get('year', timezone.now().year))
        month = request.query_params.get('month')

        # Include both old and new statuses (exclude only ARRIVED)
        # Old statuses: REGISTERED, PROCESSED
        # New statuses: PENDING_PAYMENT, TRANSFERRED_TO_BANK, PAYMENT_COMPLETE
        qs = Payment.objects.exclude(status='ARRIVED')
        
        # Filter by year - use registration_date if available, otherwise created_at
        from django.db.models import Q
        if month:
            qs = qs.filter(
                Q(registration_date__year=year, registration_date__month=int(month)) |
                Q(registration_date__isnull=True, created_at__year=year, created_at__month=int(month))
            )
        else:
            qs = qs.filter(
                Q(registration_date__year=year) |
                Q(registration_date__isnull=True, created_at__year=year)
            )

        from django.db.models import Sum, Count

        total_count = qs.count()
        total_by_currency = qs.values('currency').annotate(
            total_amount=Sum('amount'), 
            count=Count('id')
        )
        
        # Additional details with display names
        by_status_raw = qs.values('status').annotate(count=Count('id'))
        by_status = []
        for item in by_status_raw:
            status_obj = Payment.objects.filter(status=item['status']).first()
            by_status.append({
                'status': item['status'],
                'status_display': status_obj.get_status_display() if status_obj else item['status'],
                'count': item['count']
            })
        
        by_type_raw = qs.values('payment_type').annotate(count=Count('id'))
        by_type = []
        for item in by_type_raw:
            type_obj = Payment.objects.filter(payment_type=item['payment_type']).first()
            by_type.append({
                'payment_type': item['payment_type'],
                'payment_type_display': type_obj.get_payment_type_display() if type_obj else item['payment_type'],
                'count': item['count']
            })

        return Response({
            'year': year,
            'month': int(month) if month else None,
            'total_count': total_count,
            'totals': list(total_by_currency),
            'by_status': by_status,
            'by_type': by_type,
        })


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
