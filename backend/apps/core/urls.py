from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, me

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', me),
]
