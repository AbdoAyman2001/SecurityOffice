from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from .models import (
    PeopleHistory, CompaniesHistory, EmploymentHistory, FamilyRelationships,
    CorrespondenceTypes, Contacts, Correspondence, CorrespondenceContacts,
    Attachments, CorrespondenceProcedures, Permits, ApprovalDecisions,
    Accidents, Relocation, RelocationPeriod, Vehicle, CarPermit,
    CardPermits, CardPhotos
)
from .serializers import (
    UserSerializer, PeopleHistorySerializer, CompaniesHistorySerializer,
    EmploymentHistorySerializer, FamilyRelationshipsSerializer,
    CorrespondenceTypesSerializer, ContactsSerializer, CorrespondenceSerializer,
    CorrespondenceContactsSerializer, AttachmentsSerializer,
    CorrespondenceProceduresSerializer, PermitsSerializer, ApprovalDecisionsSerializer,
    AccidentsSerializer, RelocationSerializer, RelocationPeriodSerializer,
    VehicleSerializer, CarPermitSerializer, CardPermitsSerializer, CardPhotosSerializer,
    PeopleHistorySummarySerializer, CorrespondenceSummarySerializer
)

User = get_user_model()


# ====================================== USER VIEWSETS ======================================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'is_staff']
    ordering_fields = ['username', 'date_joined']
    ordering = ['username']


# ====================================== PEOPLE VIEWSETS ======================================
class PeopleHistoryViewSet(viewsets.ModelViewSet):
    queryset = PeopleHistory.objects.all()
    serializer_class = PeopleHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name_arabic', 'full_name_english', 'national_id', 'person_guid']
    filterset_fields = ['is_current', 'nationality', 'alive', 'version']
    ordering_fields = ['full_name_arabic', 'start_date', 'version']
    ordering = ['-start_date']

    @action(detail=False, methods=['get'])
    def current_only(self, request):
        """Get only current versions of people records"""
        current_people = self.queryset.filter(is_current=True)
        serializer = PeopleHistorySummarySerializer(current_people, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get all versions of a person's history by person_guid"""
        person = self.get_object()
        history = PeopleHistory.objects.filter(person_guid=person.person_guid).order_by('-version')
        serializer = self.get_serializer(history, many=True)
        return Response(serializer.data)


class CompaniesHistoryViewSet(viewsets.ModelViewSet):
    queryset = CompaniesHistory.objects.all()
    serializer_class = CompaniesHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['company_name', 'company_type']
    filterset_fields = ['is_current', 'company_type']
    ordering_fields = ['company_name', 'start_date']
    ordering = ['company_name']

    @action(detail=False, methods=['get'])
    def current_only(self, request):
        """Get only current versions of company records"""
        current_companies = self.queryset.filter(is_current=True)
        serializer = self.get_serializer(current_companies, many=True)
        return Response(serializer.data)


class EmploymentHistoryViewSet(viewsets.ModelViewSet):
    queryset = EmploymentHistory.objects.all()
    serializer_class = EmploymentHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['person_guid', 'job_title', 'company__company_name']
    filterset_fields = ['still_hired', 'is_current', 'company']
    ordering_fields = ['start_date', 'job_title']
    ordering = ['-start_date']


class FamilyRelationshipsViewSet(viewsets.ModelViewSet):
    queryset = FamilyRelationships.objects.all()
    serializer_class = FamilyRelationshipsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['worker_person_guid', 'family_member_person_guid']
    filterset_fields = ['relationship_type', 'status']
    ordering_fields = ['relationship_type']
    ordering = ['relationship_type']


# ====================================== CORRESPONDENCE VIEWSETS ======================================
class CorrespondenceTypesViewSet(viewsets.ModelViewSet):
    queryset = CorrespondenceTypes.objects.all()
    serializer_class = CorrespondenceTypesSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['type_name']
    ordering = ['type_name']


class ContactsViewSet(viewsets.ModelViewSet):
    queryset = Contacts.objects.all()
    serializer_class = ContactsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    filterset_fields = ['contact_type', 'is_approver']
    ordering_fields = ['name', 'contact_type']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def approvers(self, request):
        """Get only contacts that are approvers"""
        approvers = self.queryset.filter(is_approver=True)
        serializer = self.get_serializer(approvers, many=True)
        return Response(serializer.data)


class CorrespondenceViewSet(viewsets.ModelViewSet):
    queryset = Correspondence.objects.all()
    serializer_class = CorrespondenceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference_number', 'subject', 'summary']
    filterset_fields = ['direction', 'priority', 'type', 'correspondence_date']
    ordering_fields = ['correspondence_date', 'reference_number', 'priority']
    ordering = ['-correspondence_date']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get correspondence summary for listings"""
        correspondences = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(correspondences)
        if page is not None:
            serializer = CorrespondenceSummarySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = CorrespondenceSummarySerializer(correspondences, many=True)
        return Response(serializer.data)


class CorrespondenceContactsViewSet(viewsets.ModelViewSet):
    queryset = CorrespondenceContacts.objects.all()
    serializer_class = CorrespondenceContactsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['role', 'correspondence', 'contact']
    ordering = ['correspondence', 'role']


class AttachmentsViewSet(viewsets.ModelViewSet):
    queryset = Attachments.objects.all()
    serializer_class = AttachmentsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['file_name']
    filterset_fields = ['file_type', 'correspondence']
    ordering_fields = ['file_name', 'file_size']
    ordering = ['file_name']


class CorrespondenceProceduresViewSet(viewsets.ModelViewSet):
    queryset = CorrespondenceProcedures.objects.all()
    serializer_class = CorrespondenceProceduresSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'notes']
    filterset_fields = ['status', 'responsible_person', 'procedure_date']
    ordering_fields = ['procedure_date', 'status']
    ordering = ['-procedure_date']


# ====================================== APPROVAL VIEWSETS ======================================
class PermitsViewSet(viewsets.ModelViewSet):
    queryset = Permits.objects.all()
    serializer_class = PermitsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['person_guid', 'company__company_name']
    filterset_fields = ['permit_holder_type', 'permit_status', 'effective_date', 'expiry_date']
    ordering_fields = ['effective_date', 'expiry_date', 'permit_status']
    ordering = ['-effective_date']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active permits"""
        active_permits = self.queryset.filter(permit_status='Active')
        serializer = self.get_serializer(active_permits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get permits expiring in the next 30 days"""
        from datetime import date, timedelta
        expiry_threshold = date.today() + timedelta(days=30)
        expiring_permits = self.queryset.filter(
            permit_status='Active',
            expiry_date__lte=expiry_threshold,
            expiry_date__gte=date.today()
        )
        serializer = self.get_serializer(expiring_permits, many=True)
        return Response(serializer.data)


class ApprovalDecisionsViewSet(viewsets.ModelViewSet):
    queryset = ApprovalDecisions.objects.all()
    serializer_class = ApprovalDecisionsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['decision_status', 'approver_contact', 'permit', 'decision_date']
    ordering_fields = ['decision_date', 'decision_status']
    ordering = ['-decision_date']


# ====================================== ACCIDENTS VIEWSETS ======================================
class AccidentsViewSet(viewsets.ModelViewSet):
    queryset = Accidents.objects.all()
    serializer_class = AccidentsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['person_guid', 'description', 'address']
    filterset_fields = ['date']
    ordering_fields = ['date']
    ordering = ['-date']


# ====================================== RELOCATION VIEWSETS ======================================
class RelocationViewSet(viewsets.ModelViewSet):
    queryset = Relocation.objects.all()
    serializer_class = RelocationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['person_guid']
    filterset_fields = ['approval_status', 'building_letter', 'building_number']
    ordering_fields = ['building_number', 'flat_number']
    ordering = ['building_number', 'building_letter', 'flat_number']


class RelocationPeriodViewSet(viewsets.ModelViewSet):
    queryset = RelocationPeriod.objects.all()
    serializer_class = RelocationPeriodSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['relocation', 'start_date', 'end_date']
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']


# ====================================== VEHICLES VIEWSETS ======================================
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['plate_number', 'vehicle_id']
    filterset_fields = ['organization', 'company', 'start_date', 'end_date']
    ordering_fields = ['vehicle_id', 'start_date']
    ordering = ['vehicle_id']


class CarPermitViewSet(viewsets.ModelViewSet):
    queryset = CarPermit.objects.all()
    serializer_class = CarPermitSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['vehicle', 'start_date', 'end_date']
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']


# ====================================== CARD PERMITS VIEWSETS ======================================
class CardPermitsViewSet(viewsets.ModelViewSet):
    queryset = CardPermits.objects.all()
    serializer_class = CardPermitsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['permit_number', 'person_guid']
    filterset_fields = ['permit_type', 'status', 'issue_date', 'expiration_date']
    ordering_fields = ['issue_date', 'expiration_date', 'permit_number']
    ordering = ['-issue_date']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active card permits"""
        active_cards = self.queryset.filter(status='Active')
        serializer = self.get_serializer(active_cards, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get card permits expiring in the next 30 days"""
        from datetime import date, timedelta
        expiry_threshold = date.today() + timedelta(days=30)
        expiring_cards = self.queryset.filter(
            status='Active',
            expiration_date__lte=expiry_threshold,
            expiration_date__gte=date.today()
        )
        serializer = self.get_serializer(expiring_cards, many=True)
        return Response(serializer.data)


class CardPhotosViewSet(viewsets.ModelViewSet):
    queryset = CardPhotos.objects.all()
    serializer_class = CardPhotosSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['file_name']
    filterset_fields = ['permit', 'mime_type']
    ordering_fields = ['uploaded_at', 'file_name']
    ordering = ['-uploaded_at']
