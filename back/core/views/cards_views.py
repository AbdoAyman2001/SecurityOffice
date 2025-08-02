"""
Cards-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to card permits management:
- CardPermitsViewSet: Manages card permit records with filtering and searching
- CardPhotosViewSet: Manages card photo records with filtering
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    CardPermits,
    CardPhotos
)
from ..serializers.cards_serializers import (
    CardPermitsSerializer,
    CardPhotosSerializer
)


class CardPermitsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing card permit records.
    
    Provides CRUD operations for card permit records with filtering,
    searching, and ordering capabilities.
    """
    queryset = CardPermits.objects.all()
    serializer_class = CardPermitsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['permit_type', 'status']
    search_fields = ['permit_number', 'person_guid']
    ordering_fields = ['issue_date', 'expiration_date']
    ordering = ['-issue_date']


class CardPhotosViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing card photo records.
    
    Provides CRUD operations for card photo records with
    filtering and searching capabilities.
    """
    queryset = CardPhotos.objects.all()
    serializer_class = CardPhotosSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['mime_type']
    search_fields = ['file_name']
