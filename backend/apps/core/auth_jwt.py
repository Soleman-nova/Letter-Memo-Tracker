from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import UserProfile


class UserIdTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow users to obtain JWT tokens using UserProfile.company_id instead of username.

    We still accept the SimpleJWT expected payload keys: {"username": "...", "password": "..."}.
    The provided "username" value is treated as a User ID first; if not found, it's treated as a username.
    """

    def validate(self, attrs):
        identifier = attrs.get('username')
        password = attrs.get('password')

        if identifier:
            try:
                profile = UserProfile.objects.select_related('user').get(company_id=identifier)
                attrs['username'] = profile.user.username
            except UserProfile.DoesNotExist:
                pass

        return super().validate({'username': attrs.get('username'), 'password': password})


class UserIdTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserIdTokenObtainPairSerializer
