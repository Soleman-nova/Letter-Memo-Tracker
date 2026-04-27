from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet
from .views_regulatory import RegulatoryBodyViewSet

router = DefaultRouter()
router.register('documents', DocumentViewSet, basename='document')
router.register('regulatory-bodies', RegulatoryBodyViewSet, basename='regulatory-body')

urlpatterns = [
    path('', include(router.urls)),
]
