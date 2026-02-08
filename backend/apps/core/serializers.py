from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Department, UserProfile, USER_ROLES


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'code', 'name', 'parent', 'active']


class UserProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['role', 'role_display', 'department', 'department_name', 'department_code',
                  'can_manage_users', 'can_create_documents', 'can_edit_all_documents', 
                  'can_view_all_documents']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.CharField(write_only=True, required=False)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 
                  'profile', 'role', 'department']
        read_only_fields = ['id']

    def create(self, validated_data):
        role = validated_data.pop('role', 'CXO')
        department = validated_data.pop('department', None)
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        # Update the auto-created profile
        user.profile.role = role
        user.profile.department = department
        user.profile.save()
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)
        department = validated_data.pop('department', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if role is not None:
            instance.profile.role = role
        if department is not None:
            instance.profile.department = department
        if role is not None or department is not None:
            instance.profile.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=USER_ROLES, default='CXO')
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'role', 'department']
        read_only_fields = ['id']

    def validate(self, attrs):
        role = attrs.get('role')
        department = attrs.get('department')
        # CxO and CxO Secretary require a department
        if role in ['CXO', 'CXO_SECRETARY'] and not department:
            raise serializers.ValidationError({
                'department': 'Department is required for CxO and CxO Secretary roles'
            })
        return attrs

    def create(self, validated_data):
        role = validated_data.pop('role', 'CXO')
        department = validated_data.pop('department', None)
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        user.profile.role = role
        user.profile.department = department
        user.profile.save()
        return user


class CurrentUserSerializer(serializers.ModelSerializer):
    """Serializer for the current logged-in user with full profile details"""
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
