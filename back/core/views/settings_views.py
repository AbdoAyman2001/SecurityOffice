"""
Settings-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to settings management:
- SettingsViewSet: Manages application settings with filtering and searching
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Settings
from ..serializers.settings_serializers import SettingsSerializer


class SettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing application settings.
    
    Provides CRUD operations for settings with filtering,
    searching, and ordering capabilities.
    """
    queryset = Settings.objects.all()
    serializer_class = SettingsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['setting_type', 'category', 'is_active']
    search_fields = ['key', 'description']
    ordering_fields = ['category', 'key', 'updated_at']
    ordering = ['category', 'key']
