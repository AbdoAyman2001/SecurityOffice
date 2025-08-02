"""
People-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to people management:
- PeopleHistoryViewSet: Manages people records and their history
- CompaniesHistoryViewSet: Manages company records and their history  
- EmploymentHistoryViewSet: Manages employment records
- FamilyRelationshipsViewSet: Manages family relationship records
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    PeopleHistory, 
    CompaniesHistory, 
    EmploymentHistory, 
    FamilyRelationships
)
from ..serializers.people_serializers import (
    PeopleHistorySerializer,
    CompaniesHistorySerializer,
    EmploymentHistorySerializer,
    FamilyRelationshipsSerializer
)


class PeopleHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing people history records.
    
    Provides CRUD operations for people records with filtering,
    searching, and ordering capabilities.
    """
    queryset = PeopleHistory.objects.all()
    serializer_class = PeopleHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_current', 'nationality', 'alive']
    search_fields = ['full_name_arabic', 'full_name_english', 'national_id']
    ordering_fields = ['start_date', 'full_name_arabic']
    ordering = ['-start_date']


class CompaniesHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing company history records.
    
    Provides CRUD operations for company records with filtering
    and searching capabilities.
    """
    queryset = CompaniesHistory.objects.all()
    serializer_class = CompaniesHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_current', 'company_type']
    search_fields = ['company_name']


class EmploymentHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing employment history records.
    
    Provides CRUD operations for employment records with filtering
    and searching capabilities.
    """
    queryset = EmploymentHistory.objects.all()
    serializer_class = EmploymentHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['still_hired', 'is_current']
    search_fields = ['person_guid', 'job_title']


class FamilyRelationshipsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing family relationship records.
    
    Provides CRUD operations for family relationship records
    with filtering capabilities.
    """
    queryset = FamilyRelationships.objects.all()
    serializer_class = FamilyRelationshipsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['relationship_type', 'status']
