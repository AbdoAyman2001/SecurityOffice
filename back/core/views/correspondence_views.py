"""
Correspondence-related ViewSets for the SecurityOffice application.

This module contains all ViewSets related to correspondence management:
- CorrespondenceViewSet: Main correspondence management with complex filtering and relations
- CorrespondenceTypesViewSet: Manages correspondence types
- ContactsViewSet: Manages contacts for correspondence
- CorrespondenceTypeProcedureViewSet: Manages procedures for correspondence types
- CorrespondenceStatusLogViewSet: Manages status change logs
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from ..models import (
    CorrespondenceTypes,
    Contacts,
    Correspondence,
    CorrespondenceTypeProcedure,
    CorrespondenceStatusLog
)
from ..serializers.correspondence_serializers import (
    CorrespondenceTypesSerializer,
    ContactsSerializer,
    CorrespondenceSerializer,
    CorrespondenceTypeProcedureSerializer,
    CorrespondenceStatusLogSerializer
)


class CorrespondenceTypesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing correspondence types.
    
    Provides CRUD operations for correspondence types with
    searching capabilities.
    """
    queryset = CorrespondenceTypes.objects.all()
    serializer_class = CorrespondenceTypesSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['type_name']


class ContactsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contacts.
    
    Provides CRUD operations for contacts with filtering
    and searching capabilities.
    """
    queryset = Contacts.objects.all()
    serializer_class = ContactsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['contact_type', 'is_approver']
    search_fields = ['name']


class CorrespondenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing correspondence records.
    
    This is the main correspondence management viewset with comprehensive
    filtering, searching, ordering, and custom actions for detailed views.
    """
    queryset = Correspondence.objects.select_related(
        'type', 'contact', 'current_status', 'assigned_to', 'parent_correspondence'
    ).all()
    serializer_class = CorrespondenceSerializer
    authentication_classes = [TokenAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'reference_number', 'subject', 'summary', 'contact__name', 
        'type__type_name', 'assigned_to__full_name_arabic', 
        'assigned_to__username', 'current_status__procedure_name'
    ]
    filterset_fields = {
        'direction': ['exact', 'in'],
        'priority': ['exact', 'in'], 
        'correspondence_date': ['exact', 'gte', 'lte', 'in'],
        'reference_number': ['exact', 'icontains', 'in'],
        'created_at': ['exact', 'gte', 'lte'],
        'updated_at': ['exact', 'gte', 'lte'],
        'type__type_name': ['exact', 'in', 'icontains'],
        'contact__name': ['exact', 'in', 'icontains'],
        'current_status__procedure_name': ['exact', 'in', 'icontains'],
        'assigned_to__full_name_arabic': ['exact', 'in', 'icontains'],
        'assigned_to__username': ['exact', 'in', 'icontains'],
        'parent_correspondence__reference_number': ['exact', 'in', 'icontains'],
    }
    ordering_fields = [
        'correspondence_id', 'correspondence_date', 'reference_number', 
        'priority', 'direction', 'subject', 'created_at', 'updated_at', 
        'type__type_name', 'contact__name', 'current_status__procedure_name', 
        'assigned_to__full_name_arabic', 'parent_correspondence__reference_number'
    ]
    ordering = ['-correspondence_date']
    
    def get_permissions(self):
        """Set permissions based on action type"""
        if self.action in ['list', 'retrieve', 'detail_with_relations']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]  # Add more restrictive permissions as needed
        return [permission() for permission in permission_classes]
    
    def update(self, request, *args, **kwargs):
        """Override update method to include available procedures in response"""
        # Perform the standard update
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Save the updated instance
        updated_instance = serializer.save()
        
        # Get the standard response data
        response_serializer = self.get_serializer(updated_instance)
        response_data = response_serializer.data
        
        # Always add available procedures if the correspondence has a type
        if updated_instance.type:
            try:
                print(f"DEBUG: Adding procedures for type {updated_instance.type.correspondence_type_id}")
                
                # Get procedures for the correspondence type
                procedures = CorrespondenceTypeProcedure.objects.filter(
                    correspondence_type=updated_instance.type
                ).order_by('procedure_order')
                
                print(f"DEBUG: Found {len(procedures)} procedures")
                
                # Serialize the procedures
                procedures_serializer = CorrespondenceTypeProcedureSerializer(
                    procedures, many=True
                )
                
                # Add procedures to response
                response_data['available_procedures'] = procedures_serializer.data
                
                print(f"DEBUG: Added {len(procedures_serializer.data)} procedures to response")
                print(f"DEBUG: Procedures data: {procedures_serializer.data}")
                
            except Exception as proc_error:
                print(f"ERROR: Could not fetch procedures: {proc_error}")
                import traceback
                traceback.print_exc()
                response_data['available_procedures'] = []
        else:
            print(f"DEBUG: No type found on updated correspondence")
            response_data['available_procedures'] = []
        
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='detail-with-relations')
    def detail_with_relations(self, request, pk=None):
        """Get comprehensive letter detail with all related data in one call"""
        try:
            # Get the main correspondence with all related data
            correspondence = self.get_object()
            
            # Serialize the main correspondence
            serializer = self.get_serializer(correspondence)
            letter_data = serializer.data
            
            # Get status history
            status_logs = CorrespondenceStatusLog.objects.filter(
                correspondence=correspondence
            ).order_by('-created_at')
            status_history = CorrespondenceStatusLogSerializer(status_logs, many=True).data
            
            # Get related correspondence (parent, children, and siblings)
            related_correspondence = []
            
            # Get children (letters that have this as parent)
            children = Correspondence.objects.filter(
                parent_correspondence=correspondence
            ).select_related('type', 'contact', 'current_status')
            
            # Get siblings (letters with same parent, excluding current)
            siblings = []
            if correspondence.parent_correspondence:
                siblings = Correspondence.objects.filter(
                    parent_correspondence=correspondence.parent_correspondence
                ).exclude(correspondence_id=correspondence.correspondence_id
                ).select_related('type', 'contact', 'current_status')
            
            # Get parent if exists
            parent = []
            if correspondence.parent_correspondence:
                parent = [correspondence.parent_correspondence]
            
            # Combine all related correspondence
            all_related = list(children) + list(siblings) + parent
            if all_related:
                related_correspondence = CorrespondenceSerializer(all_related, many=True).data
            
            # Get correspondence types for editing
            correspondence_types = CorrespondenceTypes.objects.all()
            types_data = CorrespondenceTypesSerializer(correspondence_types, many=True).data
            
            # Get contacts for editing
            contacts = Contacts.objects.all()
            contacts_data = ContactsSerializer(contacts, many=True).data
            
            # Get procedures for current type
            procedures_data = []
            if correspondence.type:
                procedures = CorrespondenceTypeProcedure.objects.filter(
                    correspondence_type=correspondence.type
                ).order_by('procedure_order')
                procedures_data = CorrespondenceTypeProcedureSerializer(procedures, many=True).data
            
            # Compile comprehensive response
            response_data = {
                'letter': letter_data,
                'status_history': status_history,
                'related_correspondence': related_correspondence,
                'correspondence_types': types_data,
                'contacts': contacts_data,
                'procedures': procedures_data,
                'metadata': {
                    'has_parent': correspondence.parent_correspondence is not None,
                    'children_count': len(list(children)),
                    'siblings_count': len(list(siblings)),
                    'total_related': len(related_correspondence)
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch letter details: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'], url_path='update-field')
    def update_field(self, request, pk=None):
        """Update a single field of the correspondence with proper validation"""
        try:
            correspondence = self.get_object()
            
            # Get the field name and value from request data
            field_data = request.data
            
            print(f"DEBUG: Received field_data: {field_data}")
            
            # Check if we're updating the type field (before serializer conversion)
            is_type_update = 'type' in field_data or 'type_id' in field_data
            
            print(f"DEBUG: is_type_update = {is_type_update}")
            print(f"DEBUG: 'type' in field_data = {'type' in field_data}")
            print(f"DEBUG: 'type_id' in field_data = {'type_id' in field_data}")
            
            # Store original type value for later use
            original_type_value = field_data.get('type') or field_data.get('type_id')
            print(f"DEBUG: original_type_value = {original_type_value}")
            
            # Use the serializer to validate and update the field
            serializer = self.get_serializer(
                correspondence, 
                data=field_data, 
                partial=True
            )
            
            if serializer.is_valid():
                updated_correspondence = serializer.save()
                
                # Prepare the response data
                response_serializer = self.get_serializer(updated_correspondence)
                response_data = response_serializer.data
                
                # Always add available procedures if the correspondence has a type
                # This ensures procedures are included for any update, especially type updates
                if updated_correspondence.type:
                    try:
                        print(f"DEBUG: Adding procedures for type {updated_correspondence.type.correspondence_type_id}")
                        
                        # Get procedures for the correspondence type
                        procedures = CorrespondenceTypeProcedure.objects.filter(
                            correspondence_type=updated_correspondence.type
                        ).order_by('procedure_order')
                        
                        print(f"DEBUG: Found {len(procedures)} procedures")
                        
                        # Serialize the procedures
                        procedures_serializer = CorrespondenceTypeProcedureSerializer(
                            procedures, many=True
                        )
                        
                        # Add procedures to response
                        response_data['available_procedures'] = procedures_serializer.data
                        
                        print(f"DEBUG: Added {len(procedures_serializer.data)} procedures to response")
                        print(f"DEBUG: Procedures data: {procedures_serializer.data}")
                        
                    except Exception as proc_error:
                        print(f"ERROR: Could not fetch procedures: {proc_error}")
                        import traceback
                        traceback.print_exc()
                        response_data['available_procedures'] = []
                else:
                    print(f"DEBUG: No type found on updated correspondence")
                    response_data['available_procedures'] = []
                
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {
                        'error': 'Validation failed',
                        'details': serializer.errors
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to update field: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CorrespondenceTypeProcedureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing correspondence type procedures.
    
    Manages the procedures associated with different correspondence types,
    including their order and status (initial/final).
    """
    queryset = CorrespondenceTypeProcedure.objects.all()
    serializer_class = CorrespondenceTypeProcedureSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['correspondence_type', 'is_initial', 'is_final']
    search_fields = ['procedure_name', 'description']
    ordering_fields = ['procedure_order', 'procedure_name']
    ordering = ['correspondence_type', 'procedure_order']


class CorrespondenceStatusLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing correspondence status change logs.
    
    Tracks all status changes for correspondence records with
    timestamps and change reasons.
    """
    queryset = CorrespondenceStatusLog.objects.all()
    serializer_class = CorrespondenceStatusLogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['correspondence', 'form_status_name', 'to_status_name', 'changed_by']
    search_fields = ['change_reason', 'correspondence__reference_number']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
