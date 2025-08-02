"""
Correspondence-related Serializers for the SecurityOffice application.

This module contains all serializers related to correspondence management:
- CorrespondenceTypesSerializer: Serializer for correspondence types
- ContactsSerializer: Serializer for contacts
- AttachmentsSerializer: Serializer for attachments
- CorrespondenceTypeProcedureSerializer: Serializer for correspondence type procedures
- CorrespondenceStatusLogSerializer: Serializer for correspondence status change logs
- CorrespondenceSerializer: Main correspondence serializer with complex relationships
- CorrespondenceSummarySerializer: Lightweight serializer for correspondence listings
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import (
    CorrespondenceTypes,
    Contacts,
    Attachments,
    CorrespondenceTypeProcedure,
    CorrespondenceStatusLog,
    Correspondence
)

User = get_user_model()


class CorrespondenceTypesSerializer(serializers.ModelSerializer):
    """Serializer for correspondence types"""
    class Meta:
        model = CorrespondenceTypes
        fields = '__all__'
        read_only_fields = ['correspondence_type_id']


class ContactsSerializer(serializers.ModelSerializer):
    """Serializer for contacts"""
    class Meta:
        model = Contacts
        fields = '__all__'
        read_only_fields = ['contact_id']


class AttachmentsSerializer(serializers.ModelSerializer):
    """Serializer for attachments"""
    class Meta:
        model = Attachments
        fields = '__all__'
        read_only_fields = ['attachment_id']


class CorrespondenceTypeProcedureSerializer(serializers.ModelSerializer):
    """Serializer for correspondence type procedures"""
    correspondence_type_name = serializers.CharField(source='correspondence_type.type_name', read_only=True)
    
    class Meta:
        model = CorrespondenceTypeProcedure
        fields = '__all__'
        read_only_fields = ['id']


class CorrespondenceStatusLogSerializer(serializers.ModelSerializer):
    """Serializer for correspondence status change logs"""
    correspondence_reference = serializers.CharField(source='correspondence.reference_number', read_only=True)
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True)
    changed_by_full_name = serializers.CharField(source='changed_by.full_name_arabic', read_only=True)
    
    class Meta:
        model = CorrespondenceStatusLog
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class CorrespondenceSerializer(serializers.ModelSerializer):
    """
    Main correspondence serializer with complex relationships.
    
    This serializer handles both read and write operations with proper
    foreign key handling and backward compatibility.
    """
    # Import UserSerializer here to avoid circular imports
    from .auth_serializers import UserSerializer
    
    # Include full nested objects for read operations
    type = CorrespondenceTypesSerializer(read_only=True)
    contact = ContactsSerializer(read_only=True)
    current_status = CorrespondenceTypeProcedureSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    
    # Foreign key fields for write operations (accept IDs)
    type_id = serializers.PrimaryKeyRelatedField(
        queryset=CorrespondenceTypes.objects.all(),
        source='type',
        write_only=True,
        required=False
    )
    contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contacts.objects.all(),
        source='contact',
        write_only=True,
        required=False
    )
    current_status_id = serializers.PrimaryKeyRelatedField(
        queryset=CorrespondenceTypeProcedure.objects.all(),
        source='current_status',
        write_only=True,
        required=False
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_to',
        write_only=True,
        required=False
    )
    
    # Keep flattened fields for backward compatibility
    type_name = serializers.CharField(source='type.type_name', read_only=True)
    current_status_name = serializers.CharField(source='current_status.procedure_name', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_to_full_name = serializers.CharField(source='assigned_to.full_name_arabic', read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    attachments = AttachmentsSerializer(many=True, read_only=True)
    status_logs = CorrespondenceStatusLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = Correspondence
        fields = '__all__'
        read_only_fields = ['correspondence_id', 'created_at', 'updated_at']
    
    def to_internal_value(self, data):
        """Handle both ID-based and direct field updates"""
        # Convert direct field names to ID-based fields for compatibility
        if 'type' in data and not 'type_id' in data:
            data['type_id'] = data.pop('type')
        if 'contact' in data and not 'contact_id' in data:
            data['contact_id'] = data.pop('contact')
        if 'current_status' in data and not 'current_status_id' in data:
            data['current_status_id'] = data.pop('current_status')
        if 'assigned_to' in data and not 'assigned_to_id' in data:
            data['assigned_to_id'] = data.pop('assigned_to')
        
        return super().to_internal_value(data)
    
    def validate(self, data):
        """Custom validation to handle type-status relationship"""
        # Get the instance being updated (for partial updates)
        instance = getattr(self, 'instance', None)
        
        # Determine the final type after update
        new_type = data.get('type')
        current_type = instance.type if instance else None
        final_type = new_type if new_type else current_type
        
        # Determine the final status after update
        new_status = data.get('current_status')
        current_status = instance.current_status if instance else None
        final_status = new_status if new_status is not None else current_status
        
        # If we have both type and status, validate their relationship
        if final_type and final_status:
            # Check if the status belongs to the type
            if final_status.correspondence_type_id != final_type.correspondence_type_id:
                # Status doesn't belong to this type - clear it
                data['current_status'] = None
                print(f"Cleared invalid status {final_status.id} for type {final_type.correspondence_type_id}")
        
        # If only type is being changed and there's an existing status, validate it
        elif new_type and current_status:
            if current_status.correspondence_type_id != new_type.correspondence_type_id:
                # Current status is invalid for new type - clear it
                data['current_status'] = None
                print(f"Cleared invalid status {current_status.id} for new type {new_type.correspondence_type_id}")
        
        return super().validate(data)


class CorrespondenceSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for correspondence listings"""
    type_name = serializers.CharField(source='type.type_name', read_only=True)
    
    class Meta:
        model = Correspondence
        fields = [
            'correspondence_id', 'reference_number', 'subject', 
            'direction', 'priority', 'correspondence_date', 'type_name'
        ]
