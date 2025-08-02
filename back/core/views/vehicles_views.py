"""
Vehicles-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to vehicles management:
- VehicleViewSet: Manages vehicle records with filtering and searching
- CarPermitViewSet: Manages car permit records with ordering
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    Vehicle,
    CarPermit
)
from ..serializers.vehicles_serializers import (
    VehicleSerializer,
    CarPermitSerializer
)


class VehicleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vehicle records.
    
    Provides CRUD operations for vehicle records with filtering,
    searching, and ordering capabilities.
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['organization']
    search_fields = ['plate_number', 'vehicle_id']
    ordering_fields = ['start_date']
    ordering = ['-start_date']


class CarPermitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing car permit records.
    
    Provides CRUD operations for car permit records with
    filtering and ordering capabilities.
    """
    queryset = CarPermit.objects.all()
    serializer_class = CarPermitSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']
