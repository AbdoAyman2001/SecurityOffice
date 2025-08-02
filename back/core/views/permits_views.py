"""
Permits-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to permits management:
- PermitsViewSet: Manages permit records with filtering and ordering
- ApprovalDecisionsViewSet: Manages approval decisions for permits
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    Permits,
    ApprovalDecisions
)
from ..serializers.permits_serializers import (
    PermitsSerializer,
    ApprovalDecisionsSerializer
)


class PermitsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing permit records.
    
    Provides CRUD operations for permits with filtering,
    searching, and ordering capabilities.
    """
    queryset = Permits.objects.all()
    serializer_class = PermitsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['permit_holder_type', 'permit_status']
    search_fields = ['person_guid']
    ordering_fields = ['effective_date', 'expiry_date']
    ordering = ['-effective_date']


class ApprovalDecisionsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing approval decisions.
    
    Provides CRUD operations for approval decisions with
    filtering and ordering capabilities.
    """
    queryset = ApprovalDecisions.objects.all()
    serializer_class = ApprovalDecisionsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['decision_status']
    ordering_fields = ['decision_date']
    ordering = ['-decision_date']
