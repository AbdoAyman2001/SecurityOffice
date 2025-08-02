"""
Vehicles-related Serializers for the SecurityOffice application.

This module contains all serializers related to vehicles and car permits management:
- CarPermitSerializer: Serializer for car permits
- VehicleSerializer: Serializer for vehicles with permits and related data
"""

from rest_framework import serializers
from ..models import (
    CarPermit,
    Vehicle
)


class CarPermitSerializer(serializers.ModelSerializer):
    """Serializer for car permits"""
    class Meta:
        model = CarPermit
        fields = '__all__'
        read_only_fields = ['car_permit_id']


class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for vehicles with permits and related data"""
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    correspondence_reference = serializers.CharField(
        source='correspondence.reference_number', 
        read_only=True
    )
    permits = CarPermitSerializer(source='carpermit_set', many=True, read_only=True)
    
    class Meta:
        model = Vehicle
        fields = '__all__'
