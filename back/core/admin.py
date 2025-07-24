from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, PeopleHistory, CompaniesHistory, EmploymentHistory, FamilyRelationships,
    CorrespondenceTypes, Contacts, Correspondence, Attachments,
    CorrespondenceStatusLog, Permits, ApprovalDecisions, Accidents, Relocation,
    RelocationPeriod, Vehicle, CarPermit, CardPermits, CardPhotos, Settings
)


# ====================================== USER ADMIN ======================================
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom User Admin with role-based permissions"""
    list_display = [
        'username', 'email', 'full_name_arabic', 'first_name', 'last_name',
        'role', 'department', 'is_active', 'is_active_session', 'last_login', 'date_joined'
    ]
    list_filter = [
        'role', 'is_active', 'is_active_session', 'is_staff', 'is_superuser',
        'department', 'date_joined', 'last_login'
    ]
    search_fields = [
        'username', 'email', 'first_name', 'last_name', 'full_name_arabic',
        'department', 'phone_number'
    ]
    readonly_fields = ['date_joined', 'last_login', 'last_login_ip']
    
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('Personal info', {
            'fields': (
                'first_name', 'last_name', 'full_name_arabic',
                'email', 'phone_number', 'department'
            )
        }),
        ('Permissions & Role', {
            'fields': (
                'role', 'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            )
        }),
        ('Session Info', {
            'fields': ('is_active_session', 'last_login', 'last_login_ip'),
            'classes': ('collapse',)
        }),
        ('Important dates', {
            'fields': ('date_joined',),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'full_name_arabic',
                'department', 'phone_number', 'role', 'is_active'
            ),
        }),
    )
    
    def get_queryset(self, request):
        """Limit queryset based on user role"""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        elif request.user.is_admin():
            # Admin users can see all users except superusers
            return qs.filter(is_superuser=False)
        else:
            # Normal users can only see themselves
            return qs.filter(id=request.user.id)
    
    def has_change_permission(self, request, obj=None):
        """Check change permissions based on user role"""
        if request.user.is_superuser:
            return True
        elif request.user.is_admin():
            if obj is None:
                return True
            # Admin users can't modify superusers
            return not obj.is_superuser
        else:
            # Normal users can only modify themselves
            return obj is not None and obj.id == request.user.id
    
    def has_delete_permission(self, request, obj=None):
        """Check delete permissions based on user role"""
        if request.user.is_superuser:
            return True
        elif request.user.is_admin():
            if obj is None:
                return True
            # Admin users can't delete superusers or themselves
            return not obj.is_superuser and obj.id != request.user.id
        else:
            # Normal users can't delete users
            return False


# ====================================== PEOPLE ADMIN ======================================
@admin.register(PeopleHistory)
class PeopleHistoryAdmin(admin.ModelAdmin):
    list_display = ['person_record_id', 'full_name_arabic', 'full_name_english', 'nationality', 'is_current', 'version']
    list_filter = ['is_current', 'nationality', 'alive', 'start_date']
    search_fields = ['full_name_arabic', 'full_name_english', 'national_id', 'person_guid']
    readonly_fields = ['person_guid']
    fieldsets = (
        ('Basic Information', {
            'fields': ('person_guid', 'full_name_arabic', 'full_name_english', 'nationality', 'national_id')
        }),
        ('Personal Details', {
            'fields': ('date_of_birth', 'qualification', 'id_address', 'access_areas', 'alive')
        }),
        ('Documents', {
            'fields': ('id_scan', 'face_encodings')
        }),
        ('Correspondence', {
            'fields': ('sc_request_letter', 'response_letter')
        }),
        ('Version Control', {
            'fields': ('start_date', 'end_date', 'is_current', 'version')
        })
    )


@admin.register(CompaniesHistory)
class CompaniesHistoryAdmin(admin.ModelAdmin):
    list_display = ['company_id', 'company_name', 'company_type', 'is_current', 'version']
    list_filter = ['is_current', 'company_type', 'start_date']
    search_fields = ['company_name', 'company_type']


@admin.register(EmploymentHistory)
class EmploymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['employment_record_id', 'person_guid', 'company', 'job_title', 'still_hired', 'is_current']
    list_filter = ['still_hired', 'is_current', 'start_date']
    search_fields = ['person_guid', 'job_title']


@admin.register(FamilyRelationships)
class FamilyRelationshipsAdmin(admin.ModelAdmin):
    list_display = ['relationship_id', 'worker_person_guid', 'family_member_person_guid', 'relationship_type', 'status']
    list_filter = ['relationship_type', 'status']
    search_fields = ['worker_person_guid', 'family_member_person_guid']


# ====================================== CORRESPONDENCE ADMIN ======================================
@admin.register(CorrespondenceTypes)
class CorrespondenceTypesAdmin(admin.ModelAdmin):
    list_display = ['correspondence_type_id', 'type_name', 'category']
    search_fields = ['type_name']


@admin.register(Contacts)
class ContactsAdmin(admin.ModelAdmin):
    list_display = ['contact_id', 'name', 'contact_type', 'is_approver']
    list_filter = ['contact_type', 'is_approver']
    search_fields = ['name']





class AttachmentsInline(admin.TabularInline):
    model = Attachments
    extra = 1


@admin.register(Correspondence)
class CorrespondenceAdmin(admin.ModelAdmin):
    list_display = ['correspondence_id', 'reference_number', 'subject', 'direction', 'priority', 'correspondence_date', 'contact']
    list_filter = ['direction', 'priority', 'correspondence_date', 'type', 'contact']
    search_fields = ['reference_number', 'subject']
    inlines = [AttachmentsInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('reference_number', 'correspondence_date', 'type', 'subject', 'contact')
        }),
        ('Details', {
            'fields': ('direction', 'priority', 'summary', 'parent_correspondence')
        }),
        ('Status & Assignment', {
            'fields': ('current_status', 'assigned_to')
        })
    )





@admin.register(Attachments)
class AttachmentsAdmin(admin.ModelAdmin):
    list_display = ['attachment_id', 'correspondence', 'file_name', 'file_type', 'file_size']
    list_filter = ['file_type']
    search_fields = ['file_name']


@admin.register(CorrespondenceStatusLog)
class CorrespondenceStatusLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'correspondence', 'form_status_name', 'to_status_name', 'changed_by', 'created_at']
    list_filter = ['to_status_name', 'form_status_name', 'created_at', 'changed_by']
    search_fields = ['correspondence__reference_number', 'correspondence__subject', 'change_reason']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('correspondence', 'changed_by')


# ====================================== APPROVAL ADMIN ======================================
class ApprovalDecisionsInline(admin.TabularInline):
    model = ApprovalDecisions
    extra = 1


@admin.register(Permits)
class PermitsAdmin(admin.ModelAdmin):
    list_display = ['permit_id', 'permit_holder_type', 'permit_status', 'effective_date', 'expiry_date']
    list_filter = ['permit_holder_type', 'permit_status', 'effective_date']
    search_fields = ['person_guid']
    inlines = [ApprovalDecisionsInline]


@admin.register(ApprovalDecisions)
class ApprovalDecisionsAdmin(admin.ModelAdmin):
    list_display = ['approval_decision_id', 'permit', 'approver_contact', 'decision_status', 'decision_date']
    list_filter = ['decision_status', 'decision_date']


# ====================================== ACCIDENTS ADMIN ======================================
@admin.register(Accidents)
class AccidentsAdmin(admin.ModelAdmin):
    list_display = ['accident_id', 'person_guid', 'date', 'address']
    list_filter = ['date']
    search_fields = ['person_guid', 'description', 'address']


# ====================================== RELOCATION ADMIN ======================================
class RelocationPeriodInline(admin.TabularInline):
    model = RelocationPeriod
    extra = 1


@admin.register(Relocation)
class RelocationAdmin(admin.ModelAdmin):
    list_display = ['relocation_id', 'person_guid', 'approval_status', 'building_number', 'building_letter', 'flat_number']
    list_filter = ['approval_status', 'building_letter']
    search_fields = ['person_guid']
    inlines = [RelocationPeriodInline]


@admin.register(RelocationPeriod)
class RelocationPeriodAdmin(admin.ModelAdmin):
    list_display = ['relocation_period_id', 'relocation', 'start_date', 'end_date']
    list_filter = ['start_date', 'end_date']


# ====================================== VEHICLES ADMIN ======================================
@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['vehicle_id', 'organization', 'plate_number', 'company', 'start_date', 'end_date']
    list_filter = ['organization', 'start_date']
    search_fields = ['plate_number', 'vehicle_id']


@admin.register(CarPermit)
class CarPermitAdmin(admin.ModelAdmin):
    list_display = ['car_permit_id', 'vehicle', 'start_date', 'end_date']
    list_filter = ['start_date', 'end_date']


# ====================================== CARD PERMITS ADMIN ======================================
class CardPhotosInline(admin.StackedInline):
    model = CardPhotos
    extra = 0
    max_num = 1


@admin.register(CardPermits)
class CardPermitsAdmin(admin.ModelAdmin):
    list_display = ['permit_id', 'permit_number', 'permit_type', 'person_guid', 'status', 'issue_date', 'expiration_date']
    list_filter = ['permit_type', 'status', 'issue_date']
    search_fields = ['permit_number', 'person_guid']
    inlines = [CardPhotosInline]


@admin.register(CardPhotos)
class CardPhotosAdmin(admin.ModelAdmin):
    list_display = ['photo_id', 'permit', 'file_name', 'mime_type', 'uploaded_at']
    list_filter = ['mime_type', 'uploaded_at']
    search_fields = ['file_name']


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'setting_type', 'category', 'is_active', 'updated_at']
    list_filter = ['setting_type', 'category', 'is_active', 'created_at']
    search_fields = ['key', 'description']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('key', 'value', 'setting_type')
        }),
        ('Categorization', {
            'fields': ('category', 'description')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
