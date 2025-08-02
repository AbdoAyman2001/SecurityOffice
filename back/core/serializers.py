from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    PeopleHistory, CompaniesHistory, EmploymentHistory, FamilyRelationships,
    CorrespondenceTypes, Contacts, Correspondence,
    Attachments, Permits, ApprovalDecisions,
    Accidents, Relocation, RelocationPeriod, Vehicle, CarPermit,
    CardPermits, CardPhotos, Settings, CorrespondenceTypeProcedure, CorrespondenceStatusLog
)

from django.contrib.auth import authenticate

User = get_user_model()


# ====================================== USER SERIALIZERS ======================================
class UserSerializer(serializers.ModelSerializer):
    """Complete user serializer with role information"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name_arabic', 'department', 'phone_number',
            'role', 'role_display', 'is_active', 'is_active_session',
            'last_login', 'last_login_ip', 'date_joined'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'last_login_ip', 'role_display'
        ]


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, write_only=True)
    remember_me = serializers.BooleanField(default=False)


class LoginResponseSerializer(serializers.Serializer):
    """Serializer for login response"""
    user = UserSerializer(read_only=True)
    token = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    permissions = serializers.DictField(read_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        return data


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (admin only)"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'full_name_arabic', 'department', 'phone_number',
            'role', 'is_active', 'password', 'confirm_password'
        ]
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information"""
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'full_name_arabic',
            'department', 'phone_number', 'role', 'is_active'
        ]
    
    def update(self, instance, validated_data):
        # Only allow role changes by admins
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if not request.user.is_admin() and 'role' in validated_data:
                validated_data.pop('role')
        return super().update(instance, validated_data)


class UserPermissionsSerializer(serializers.Serializer):
    """Serializer for user permissions"""
    can_create_correspondence = serializers.BooleanField(read_only=True)
    can_edit_correspondence = serializers.BooleanField(read_only=True)
    can_delete_correspondence = serializers.BooleanField(read_only=True)
    can_manage_users = serializers.BooleanField(read_only=True)
    can_view_reports = serializers.BooleanField(read_only=True)
    can_manage_permits = serializers.BooleanField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    is_normal_user = serializers.BooleanField(read_only=True)


# ====================================== PEOPLE SERIALIZERS ======================================
class PeopleHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PeopleHistory
        fields = '__all__'
        read_only_fields = ['person_record_id', 'person_guid']


class CompaniesHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompaniesHistory
        fields = '__all__'
        read_only_fields = ['company_id']


class EmploymentHistorySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    
    class Meta:
        model = EmploymentHistory
        fields = '__all__'
        read_only_fields = ['employment_record_id']


class FamilyRelationshipsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyRelationships
        fields = '__all__'
        read_only_fields = ['relationship_id']


# ====================================== CORRESPONDENCE SERIALIZERS ======================================
class CorrespondenceTypesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CorrespondenceTypes
        fields = '__all__'
        read_only_fields = ['correspondence_type_id']


class ContactsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contacts
        fields = '__all__'
        read_only_fields = ['contact_id']


class AttachmentsSerializer(serializers.ModelSerializer):
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


# ====================================== APPROVAL SERIALIZERS ======================================
class ApprovalDecisionsSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver_contact.name', read_only=True)
    
    class Meta:
        model = ApprovalDecisions
        fields = '__all__'
        read_only_fields = ['approval_decision_id']


class PermitsSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    approval_decisions = ApprovalDecisionsSerializer(
        source='approvaldecisions_set',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = Permits
        fields = '__all__'
        read_only_fields = ['permit_id']


# ====================================== ACCIDENTS SERIALIZERS ======================================
class AccidentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accidents
        fields = '__all__'
        read_only_fields = ['accident_id']


# ====================================== RELOCATION SERIALIZERS ======================================
class RelocationPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelocationPeriod
        fields = '__all__'
        read_only_fields = ['relocation_period_id']


class RelocationSerializer(serializers.ModelSerializer):
    periods = RelocationPeriodSerializer(many=True, read_only=True)
    relocation_letter_reference = serializers.CharField(
        source='relocation_letter.reference_number', 
        read_only=True
    )
    
    class Meta:
        model = Relocation
        fields = '__all__'
        read_only_fields = ['relocation_id']


# ====================================== VEHICLES SERIALIZERS ======================================
class CarPermitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarPermit
        fields = '__all__'
        read_only_fields = ['car_permit_id']


class VehicleSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    correspondence_reference = serializers.CharField(
        source='correspondence.reference_number', 
        read_only=True
    )
    permits = CarPermitSerializer(source='carpermit_set', many=True, read_only=True)
    
    class Meta:
        model = Vehicle
        fields = '__all__'


# ====================================== CARD PERMITS SERIALIZERS ======================================
class CardPhotosSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardPhotos
        fields = '__all__'
        read_only_fields = ['photo_id', 'uploaded_at']


class CardPermitsSerializer(serializers.ModelSerializer):
    photo = CardPhotosSerializer(source='cardphotos', read_only=True)
    
    class Meta:
        model = CardPermits
        fields = '__all__'
        read_only_fields = ['permit_id', 'created_at', 'updated_at']


# ====================================== SUMMARY SERIALIZERS ======================================
class PeopleHistorySummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for people listings"""
    class Meta:
        model = PeopleHistory
        fields = [
            'person_record_id', 'person_guid', 'full_name_arabic', 
            'full_name_english', 'nationality', 'is_current', 'version'
        ]


class CorrespondenceSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for correspondence listings"""
    type_name = serializers.CharField(source='type.type_name', read_only=True)
    
    class Meta:
        model = Correspondence
        fields = [
            'correspondence_id', 'reference_number', 'subject', 
            'direction', 'priority', 'correspondence_date', 'type_name'
        ]

# ====================================== SETTINGS SERIALIZERS ======================================
class SettingsSerializer(serializers.ModelSerializer):
    """Serializer for system settings"""
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Settings
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_typed_value(self, obj):
        """Return the typed value of the setting"""
        return obj.get_typed_value()
