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
from .permissions import IsCEO, IsCEOSecretary, IsCEOOrCEOSecretary


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
        else:
            # Non-CEO users only see processed payments
            queryset = queryset.filter(status='PROCESSED')
        
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsCEOOrCEOSecretary])
    def monthly_summary(self, request):
        """Return monthly payment totals and counts for a given year/month."""
        year = int(request.query_params.get('year', timezone.now().year))
        month = request.query_params.get('month')

        # Filter by registration_date since payment_date might be null initially
        qs = Payment.objects.filter(registration_date__year=year)
        if month:
            qs = qs.filter(registration_date__month=int(month))

        from django.db.models import Sum, Count

        total_count = qs.count()
        total_by_currency = qs.values('currency').annotate(
            total_amount=Sum('amount'), 
            count=Count('id')
        )
        
        # Additional details
        by_status = qs.values('status').annotate(count=Count('id'))
        by_type = qs.values('payment_type').annotate(count=Count('id'))

        return Response({
            'year': year,
            'month': int(month) if month else None,
            'total_count': total_count,
            'totals': list(total_by_currency),
            'by_status': list(by_status),
            'by_type': list(by_type),
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
