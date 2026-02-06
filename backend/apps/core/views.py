from rest_framework import viewsets, permissions, decorators, response
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all().order_by('code')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


@decorators.api_view(['GET'])
@decorators.permission_classes([permissions.IsAuthenticated])
def me(request):
    u = request.user
    return response.Response({
        'id': u.id,
        'username': u.username,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'email': u.email,
        'is_staff': u.is_staff,
        'is_superuser': u.is_superuser,
    })
