"""
People-related Serializers for the SecurityOffice application.

This module contains all serializers related to people management:
- PeopleHistorySerializer: Serializer for people history records
- CompaniesHistorySerializer: Serializer for companies history records
- EmploymentHistorySerializer: Serializer for employment history records
- FamilyRelationshipsSerializer: Serializer for family relationships
- PeopleHistorySummarySerializer: Lightweight serializer for people listings
"""

from rest_framework import serializers
from ..models import (
    PeopleHistory,
    CompaniesHistory,
    EmploymentHistory,
    FamilyRelationships
)


class PeopleHistorySerializer(serializers.ModelSerializer):
    """Serializer for people history records"""
    class Meta:
        model = PeopleHistory
        fields = '__all__'
        read_only_fields = ['person_record_id', 'person_guid']


class CompaniesHistorySerializer(serializers.ModelSerializer):
    """Serializer for companies history records"""
    class Meta:
        model = CompaniesHistory
        fields = '__all__'
        read_only_fields = ['company_id']


class EmploymentHistorySerializer(serializers.ModelSerializer):
    """Serializer for employment history records"""
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    
    class Meta:
        model = EmploymentHistory
        fields = '__all__'
        read_only_fields = ['employment_record_id']


class FamilyRelationshipsSerializer(serializers.ModelSerializer):
    """Serializer for family relationships"""
    class Meta:
        model = FamilyRelationships
        fields = '__all__'
        read_only_fields = ['relationship_id']


class PeopleHistorySummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for people listings"""
    class Meta:
        model = PeopleHistory
        fields = [
            'person_record_id', 'person_guid', 'full_name_arabic', 
            'full_name_english', 'nationality', 'is_current', 'version'
        ]
