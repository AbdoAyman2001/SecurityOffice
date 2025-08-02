"""
Relocation-related Serializers for the SecurityOffice application.

This module contains all serializers related to relocation management:
- RelocationPeriodSerializer: Serializer for relocation periods
- RelocationSerializer: Serializer for relocation records with periods
"""

from rest_framework import serializers
from ..models import (
    RelocationPeriod,
    Relocation
)


class RelocationPeriodSerializer(serializers.ModelSerializer):
    """Serializer for relocation periods"""
    class Meta:
        model = RelocationPeriod
        fields = '__all__'
        read_only_fields = ['relocation_period_id']


class RelocationSerializer(serializers.ModelSerializer):
    """Serializer for relocation records with periods"""
    periods = RelocationPeriodSerializer(many=True, read_only=True)
    relocation_letter_reference = serializers.CharField(
        source='relocation_letter.reference_number', 
        read_only=True
    )
    
    class Meta:
        model = Relocation
        fields = '__all__'
        read_only_fields = ['relocation_id']
