from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PaymentHistoryViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payment-history', PaymentHistoryViewSet, basename='payment-history')

urlpatterns = [
    path('', include(router.urls)),
]
