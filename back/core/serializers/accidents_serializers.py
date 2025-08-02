"""
Accidents-related Serializers for the SecurityOffice application.

This module contains all serializers related to accidents management:
- AccidentsSerializer: Serializer for accidents records
"""

from rest_framework import serializers
from ..models import Accidents


class AccidentsSerializer(serializers.ModelSerializer):
    """Serializer for accidents records"""
    class Meta:
        model = Accidents
        fields = '__all__'
        read_only_fields = ['accident_id']
