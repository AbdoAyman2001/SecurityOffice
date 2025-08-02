"""
Permits-related Serializers for the SecurityOffice application.

This module contains all serializers related to permits and approval management:
- ApprovalDecisionsSerializer: Serializer for approval decisions
- PermitsSerializer: Serializer for permits with approval decisions
"""

from rest_framework import serializers
from ..models import (
    ApprovalDecisions,
    Permits
)


class ApprovalDecisionsSerializer(serializers.ModelSerializer):
    """Serializer for approval decisions"""
    approver_name = serializers.CharField(source='approver_contact.name', read_only=True)
    
    class Meta:
        model = ApprovalDecisions
        fields = '__all__'
        read_only_fields = ['approval_decision_id']


class PermitsSerializer(serializers.ModelSerializer):
    """Serializer for permits with approval decisions"""
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    approval_decisions = ApprovalDecisionsSerializer(
        source='approvaldecisions_set',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = Permits
        fields = '__all__'
        read_only_fields = ['permit_id']
