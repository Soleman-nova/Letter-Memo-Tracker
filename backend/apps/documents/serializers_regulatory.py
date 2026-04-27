from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RegulatoryBody

User = get_user_model()


class RegulatoryBodySerializer(serializers.ModelSerializer):
    """Serializer for regulatory body management"""
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RegulatoryBody
        fields = ['id', 'name_en', 'name_am', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['created_by', 'created_at']
    
    def get_created_by_name(self, obj):
        """Return the name of the user who created the regulatory body"""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None
    
    def create(self, validated_data):
        """Set created_by to current user when creating regulatory body"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class RegulatoryBodyListSerializer(serializers.ModelSerializer):
    """Simple serializer for regulatory body dropdown/autocomplete"""
    localized_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RegulatoryBody
        fields = ['id', 'name_en', 'name_am', 'localized_name']
    
    def get_localized_name(self, obj):
        """Return name based on language from request context"""
        request = self.context.get('request')
        language = 'am' if request and request.META.get('HTTP_ACCEPT_LANGUAGE', '').startswith('am') else 'en'
        return obj.get_localized_name(language)
