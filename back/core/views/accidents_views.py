"""
Accidents-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to accidents management:
- AccidentsViewSet: Manages accident records with filtering and searching
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Accidents
from ..serializers.accidents_serializers import AccidentsSerializer


class AccidentsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing accident records.
    
    Provides CRUD operations for accident records with filtering,
    searching, and ordering capabilities.
    """
    queryset = Accidents.objects.all()
    serializer_class = AccidentsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['person_guid', 'description', 'address']
    ordering_fields = ['date']
    ordering = ['-date']
