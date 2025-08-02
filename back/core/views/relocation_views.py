"""
Relocation-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to relocation management:
- RelocationViewSet: Manages relocation records with filtering and searching
- RelocationPeriodViewSet: Manages relocation period records with ordering
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    Relocation,
    RelocationPeriod
)
from ..serializers.relocation_serializers import (
    RelocationSerializer,
    RelocationPeriodSerializer
)


class RelocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing relocation records.
    
    Provides CRUD operations for relocation records with filtering
    and searching capabilities.
    """
    queryset = Relocation.objects.all()
    serializer_class = RelocationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['approval_status', 'building_letter']
    search_fields = ['person_guid']


class RelocationPeriodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing relocation period records.
    
    Provides CRUD operations for relocation period records with
    filtering and ordering capabilities.
    """
    queryset = RelocationPeriod.objects.all()
    serializer_class = RelocationPeriodSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']
