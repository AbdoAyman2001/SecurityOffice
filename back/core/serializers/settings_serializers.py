"""
Settings-related Serializers for the SecurityOffice application.

This module contains all serializers related to system settings management:
- SettingsSerializer: Serializer for system settings with typed values
"""

from rest_framework import serializers
from ..models import Settings


class SettingsSerializer(serializers.ModelSerializer):
    """Serializer for system settings"""
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Settings
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_typed_value(self, obj):
        """Return the typed value of the setting"""
        return obj.get_typed_value()
