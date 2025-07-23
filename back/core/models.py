from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone
import uuid
from django.core.validators import FileExtensionValidator


# ====================================== USERS ======================================
class User(AbstractUser):
    """Custom User model extending Django's AbstractUser with role-based permissions"""
    
    USER_ROLES = [
        ('admin', 'Administrator'),
        ('normal', 'Normal User'),
    ]
    
    role = models.CharField(
        max_length=20, 
        choices=USER_ROLES, 
        default='normal',
        help_text='User role for authorization purposes'
    )
    full_name_arabic = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text='Full name in Arabic'
    )
    department = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text='User department'
    )
    phone_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text='Contact phone number'
    )
    is_active_session = models.BooleanField(
        default=False,
        help_text='Track if user has an active session'
    )
    last_login_ip = models.GenericIPAddressField(
        blank=True, 
        null=True,
        help_text='Last login IP address'
    )
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def is_admin(self):
        """Check if user is an administrator"""
        return self.role == 'admin' or self.is_superuser
    
    def is_normal_user(self):
        """Check if user is a normal user"""
        return self.role == 'normal'
    
    def can_create_correspondence(self):
        """Check if user can create correspondence"""
        return self.is_active and (self.is_admin() or self.is_normal_user())
    
    def can_edit_correspondence(self):
        """Check if user can edit correspondence"""
        return self.is_active and self.is_admin()
    
    def can_delete_correspondence(self):
        """Check if user can delete correspondence"""
        return self.is_active and self.is_admin()
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.is_active and self.is_admin()
    
    def can_view_reports(self):
        """Check if user can view reports"""
        return self.is_active and (self.is_admin() or self.is_normal_user())
    
    def can_manage_permits(self):
        """Check if user can manage permits"""
        return self.is_active and self.is_admin()


# ====================================== PEOPLE ======================================
class PeopleHistory(models.Model):
    """
    This table is used for storing the people's information regardless 
    they are family member or worker
    """
    person_record_id = models.AutoField(primary_key=True, help_text='Primary key for this specific historical record.')
    person_guid = models.UUIDField(default=uuid.uuid4, help_text='The permanent, unchanging ID for an individual. Links all their records together.')
    
    # Personal details that can change over time
    full_name_arabic = models.CharField(max_length=255)
    full_name_english = models.CharField(max_length=255, blank=True, null=True)
    nationality = models.CharField(max_length=50, blank=True, null=True)
    national_id = models.CharField(max_length=50, blank=True, null=True)
    access_areas = models.CharField(max_length=50, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    qualification = models.CharField(max_length=50, blank=True, null=True)
    id_address = models.CharField(max_length=255, blank=True, null=True)
    alive = models.BooleanField(default=True)
    id_scan = models.CharField(max_length=255, blank=True, null=True, help_text='link to the image of the Id')
    face_encodings = models.TextField(blank=True, null=True, help_text='for face recognition - stored as JSON')
    
    # Foreign keys
    sc_request_letter = models.ForeignKey('Correspondence', on_delete=models.SET_NULL, null=True, blank=True, related_name='sc_requests', help_text='The letter the sc request was made')
    response_letter = models.ForeignKey('Correspondence', on_delete=models.SET_NULL, null=True, blank=True, related_name='responses', help_text='The number that we mentioned to respond on the Person with the Approval')
    
    # Version Control Columns
    start_date = models.DateTimeField(help_text='The date this version of the information became effective.')
    end_date = models.DateTimeField(null=True, blank=True, help_text='NULL means this is the current, active version.')
    is_current = models.BooleanField(default=True, help_text='Flag to easily find the current version.')
    version = models.IntegerField(help_text='Version number for this person\'s personal data history.')
    
    class Meta:
        db_table = 'people_history'
        verbose_name = 'Person History'
        verbose_name_plural = 'People History'
        indexes = [
            models.Index(fields=['person_guid']),
            models.Index(fields=['is_current']),
        ]
    
    def __str__(self):
        return f"{self.full_name_arabic} (v{self.version})"


class CompaniesHistory(models.Model):
    """Companies information with version control"""
    company_id = models.AutoField(primary_key=True)
    company_name = models.CharField(max_length=255)
    company_type = models.CharField(max_length=100, blank=True, null=True)
    contact_info = models.TextField(blank=True, null=True)
    
    # Version Control
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    version = models.IntegerField()
    
    class Meta:
        db_table = 'companies_history'
        verbose_name = 'Company History'
        verbose_name_plural = 'Companies History'
    
    def __str__(self):
        return f"{self.company_name} (v{self.version})"


class EmploymentHistory(models.Model):
    """Employment history with version control"""
    employment_record_id = models.AutoField(primary_key=True)
    person_guid = models.UUIDField(help_text='Links this job record back to the person in People_History.')
    company = models.ForeignKey(CompaniesHistory, on_delete=models.CASCADE)
    
    # Job-specific details
    job_title = models.CharField(max_length=100, blank=True, null=True)
    still_hired = models.BooleanField(default=True)
    
    # Version Control Columns
    start_date = models.DateTimeField(help_text='When this job record became active.')
    end_date = models.DateTimeField(null=True, blank=True, help_text='Null means this is the current job record.')
    is_current = models.BooleanField(default=True, help_text='Flag for the current job.')
    version = models.IntegerField(help_text='Version number for this person\'s employment history.')
    
    class Meta:
        db_table = 'employment_history'
        verbose_name = 'Employment History'
        verbose_name_plural = 'Employment History'
    
    def __str__(self):
        return f"{self.job_title} at {self.company.company_name}"


class FamilyRelationships(models.Model):
    """Family relationships between workers and their family members"""
    RELATIONSHIP_CHOICES = [
        ('Spouse', 'Spouse'),
        ('Son', 'Son'),
        ('Daughter', 'Daughter'),
        ('Father', 'Father'),
        ('Mother', 'Mother'),
        ('Brother', 'Brother'),
        ('Sister', 'Sister'),
    ]
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Left', 'Left'),
        ('Deceased', 'Deceased'),
    ]
    
    relationship_id = models.AutoField(primary_key=True)
    worker_person_guid = models.UUIDField(help_text='The GUID of the person who is the employee.')
    family_member_person_guid = models.UUIDField(help_text='The GUID of the person who is the family member.')
    relationship_type = models.CharField(max_length=50, choices=RELATIONSHIP_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    proof_document_url = models.CharField(max_length=255, blank=True, null=True, help_text='Link to the scanned proof document.')
    
    class Meta:
        db_table = 'family_relationships'
        verbose_name = 'Family Relationship'
        verbose_name_plural = 'Family Relationships'
    
    def __str__(self):
        return f"{self.relationship_type} relationship"


# ====================================== CORRESPONDENCE ======================================
class CorrespondenceTypes(models.Model):
    """Types of correspondence"""
    correspondence_type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(max_length=255)
    
    class Meta:
        db_table = 'correspondence_types'
        verbose_name = 'Correspondence Type'
        verbose_name_plural = 'Correspondence Types'
    
    def __str__(self):
        return self.type_name


class CorrespondenceTypeProcedure(models.Model):
    """Procedures/statuses for each correspondence type"""
    id = models.AutoField(primary_key=True)
    correspondence_type = models.ForeignKey(CorrespondenceTypes, on_delete=models.CASCADE, related_name='procedures')
    procedure_name = models.CharField(max_length=255, help_text='Name of the procedure/status step')
    procedure_order = models.IntegerField(default=0, help_text='Order of this procedure in the workflow')
    is_initial = models.BooleanField(default=False, help_text='True if this is the initial status')
    is_final = models.BooleanField(default=False, help_text='True if this is a final status')
    description = models.TextField(blank=True, null=True, help_text='Description of what happens in this procedure')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'correspondence_type_procedure'
        verbose_name = 'Correspondence Type Procedure'
        verbose_name_plural = 'Correspondence Type Procedures'
        unique_together = ['correspondence_type', 'procedure_name']
        ordering = ['correspondence_type', 'procedure_order']
    
    def __str__(self):
        return f"{self.correspondence_type.type_name} - {self.procedure_name}"


class Contacts(models.Model):
    """Contacts for correspondence"""
    CONTACT_TYPE_CHOICES = [
        ('Person', 'Person'),
        ('Organization', 'Organization'),
    ]
    
    contact_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    contact_type = models.CharField(max_length=50, choices=CONTACT_TYPE_CHOICES, default='Person', help_text='Specifies if the contact is an individual or an official body.')
    is_approver = models.BooleanField(default=False, help_text='True if this contact (must be an Organization) has the authority to approve permits.')
    
    class Meta:
        db_table = 'contacts'
        verbose_name = 'Contact'
        verbose_name_plural = 'Contacts'
    
    def __str__(self):
        return f"{self.name} ({self.contact_type})"


class Correspondence(models.Model):
    """Main correspondence table"""
    DIRECTION_CHOICES = [
        ('Incoming', 'Incoming'),
        ('Outgoing', 'Outgoing'),
        ('Internal', 'Internal'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('normal', 'Normal'),
        ('low', 'Low'),
    ]
    
    correspondence_id = models.AutoField(primary_key=True)
    parent_correspondence = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    correspondence_date = models.DateField(blank=True, null=True)
    type = models.ForeignKey(CorrespondenceTypes, on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    direction = models.CharField(max_length=50, choices=DIRECTION_CHOICES, help_text='the flow of the correspondence')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    summary = models.CharField(max_length=1000, blank=True, null=True)
    current_status = models.ForeignKey('CorrespondenceTypeProcedure', on_delete=models.SET_NULL, null=True, blank=True, help_text='Current status/procedure of this correspondence')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="المسؤول")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'correspondence'
        verbose_name = 'Correspondence'
        verbose_name_plural = 'Correspondence'
    
    def __str__(self):
        return f"Correspondence {self.correspondence_id} - {self.subject or 'No Subject'}"
    
    def get_current_status_display(self):
        """Get the display name of current status"""
        return self.current_status.procedure_name if self.current_status else 'No Status'


class CorrespondenceStatusLog(models.Model):
    """Log of status changes for correspondence tracking"""
    id = models.AutoField(primary_key=True)
    correspondence = models.ForeignKey(Correspondence, on_delete=models.CASCADE, related_name='status_logs')
    from_status = models.ForeignKey(CorrespondenceTypeProcedure, on_delete=models.SET_NULL, null=True, blank=True, related_name='from_status_logs', help_text='Previous status')
    to_status = models.ForeignKey(CorrespondenceTypeProcedure, on_delete=models.SET_NULL, null=True, related_name='to_status_logs', help_text='New status')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="تم التغيير بواسطة", null=True, blank=True)
    change_reason = models.TextField(blank=True, null=True, help_text='Optional reason for the status change')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'correspondence_status_log'
        verbose_name = 'Correspondence Status Log'
        verbose_name_plural = 'Correspondence Status Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        from_status_name = self.from_status.procedure_name if self.from_status else 'Initial'
        return f"Correspondence {self.correspondence.correspondence_id}: {from_status_name} → {self.to_status.procedure_name} by {self.changed_by.username}"


class CorrespondenceContacts(models.Model):
    """Many-to-many relationship between correspondence and contacts"""
    ROLE_CHOICES = [
        ('Sender', 'Sender'),
        ('Recipient', 'Recipient'),
        ('CC', 'CC'),
        ('BCC', 'BCC'),
    ]
    
    contact = models.ForeignKey(Contacts, on_delete=models.CASCADE)
    correspondence = models.ForeignKey(Correspondence, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    class Meta:
        db_table = 'correspondence_contacts'
        unique_together = ['correspondence', 'contact', 'role']
        verbose_name = 'Correspondence Contact'
        verbose_name_plural = 'Correspondence Contacts'
    
    def __str__(self):
        return f"{self.contact.name} - {self.role}"


def attachment_upload_path(instance, filename):
    """Generate upload path for attachments"""
    return f'attachments/{instance.correspondence.correspondence_id}/{filename}'

class Attachments(models.Model):
    """File attachments for correspondence"""
    attachment_id = models.AutoField(primary_key=True)
    correspondence = models.ForeignKey(Correspondence, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=attachment_upload_path, help_text='Uploaded file')
    file_name = models.CharField(max_length=255, help_text='Original filename')
    file_type = models.CharField(max_length=100, blank=True, null=True, help_text='mime type')
    file_size = models.BigIntegerField(blank=True, null=True, help_text='File size in bytes')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'attachments'
        verbose_name = 'Attachment'
        verbose_name_plural = 'Attachments'
    
    def __str__(self):
        return self.file_name


# ====================================== APPROVAL ======================================
class Permits(models.Model):
    """Permits for people or companies"""
    PERMIT_HOLDER_CHOICES = [
        ('Person', 'Person'),
        ('Company', 'Company'),
    ]
    
    PERMIT_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Active', 'Active'),
        ('Rejected', 'Rejected'),
        ('Expired', 'Expired'),
        ('Revoked', 'Revoked'),
    ]
    
    permit_id = models.AutoField(primary_key=True)
    permit_holder_type = models.CharField(max_length=20, choices=PERMIT_HOLDER_CHOICES, help_text='Specifies if the permit is for a person or a company.')
    person_guid = models.UUIDField(null=True, blank=True, help_text='FK to People_History. Filled if PermitHolderType is Person.')
    company = models.ForeignKey(CompaniesHistory, on_delete=models.CASCADE, null=True, blank=True, help_text='FK to Companies. Filled if PermitHolderType is Company.')
    
    permit_status = models.CharField(max_length=20, choices=PERMIT_STATUS_CHOICES, default='Pending', help_text='Overall status derived from the ApprovalDecisions.')
    effective_date = models.DateField(null=True, blank=True, help_text='When the permit becomes active.')
    expiry_date = models.DateField(null=True, blank=True, help_text='When the permit expires.')
    
    class Meta:
        db_table = 'permits'
        verbose_name = 'Permit'
        verbose_name_plural = 'Permits'
    
    def __str__(self):
        return f"Permit {self.permit_id} - {self.permit_status}"


class ApprovalDecisions(models.Model):
    """Approval decisions for permits"""
    DECISION_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    
    approval_decision_id = models.AutoField(primary_key=True)
    permit = models.ForeignKey(Permits, on_delete=models.CASCADE)
    approver_contact = models.ForeignKey(Contacts, on_delete=models.CASCADE, help_text='FK to the Contact (of type Organization) that is the official approver.')
    
    decision_status = models.CharField(max_length=20, choices=DECISION_STATUS_CHOICES, default='Pending')
    decision_date = models.DateTimeField(null=True, blank=True)
    correspondence = models.ForeignKey(Correspondence, on_delete=models.SET_NULL, null=True, blank=True, help_text='Link to the formal letter of approval/rejection. NULL if verbal.')
    notes = models.CharField(max_length=1000, blank=True, null=True, help_text='Required for verbal approvals.')
    
    class Meta:
        db_table = 'approval_decisions'
        unique_together = ['permit', 'approver_contact']
        verbose_name = 'Approval Decision'
        verbose_name_plural = 'Approval Decisions'
    
    def __str__(self):
        return f"{self.permit} - {self.decision_status}"


# ====================================== ACCIDENTS ======================================
class Accidents(models.Model):
    """Accident records"""
    accident_id = models.AutoField(primary_key=True)
    description = models.CharField(max_length=4096, blank=True, null=True)
    person_guid = models.UUIDField(help_text='FK to People_History. Person involved in the accident.')
    address = models.CharField(max_length=1024, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    
    class Meta:
        db_table = 'accidents'
        verbose_name = 'Accident'
        verbose_name_plural = 'Accidents'
    
    def __str__(self):
        return f"Accident {self.accident_id} - {self.date}"


# ====================================== RELOCATION ======================================
class Relocation(models.Model):
    """Relocation requests and approvals"""
    APPROVAL_STATUS_CHOICES = [
        ('انتظار', 'انتظار'),  # Waiting
        ('حاصل', 'حاصل'),    # Approved
    ]
    
    BUILDING_LETTER_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
    ]
    
    relocation_id = models.AutoField(primary_key=True)
    relocation_letter = models.ForeignKey(Correspondence, on_delete=models.SET_NULL, null=True, blank=True)
    person_guid = models.UUIDField(help_text='FK to People_History. Person requesting relocation.')
    approval_status = models.CharField(max_length=10, choices=APPROVAL_STATUS_CHOICES, blank=True, null=True)
    building_number = models.IntegerField(blank=True, null=True)
    building_letter = models.CharField(max_length=1, choices=BUILDING_LETTER_CHOICES, blank=True, null=True)
    flat_number = models.IntegerField(blank=True, null=True)
    
    class Meta:
        db_table = 'relocation'
        verbose_name = 'Relocation'
        verbose_name_plural = 'Relocations'
    
    def __str__(self):
        return f"Relocation {self.relocation_id} - Building {self.building_number}{self.building_letter}"


class RelocationPeriod(models.Model):
    """Time periods for relocations"""
    relocation_period_id = models.AutoField(primary_key=True)
    relocation = models.ForeignKey(Relocation, on_delete=models.CASCADE, related_name='periods')
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    
    class Meta:
        db_table = 'relocation_period'
        verbose_name = 'Relocation Period'
        verbose_name_plural = 'Relocation Periods'
    
    def __str__(self):
        return f"Period {self.relocation_period_id} for {self.relocation}"


# ====================================== VEHICLES ======================================
class Vehicle(models.Model):
    """Vehicle information"""
    ORGANIZATION_CHOICES = [
        ('Owner', 'Owner'),
        ('Contractor', 'Contractor'),
    ]
    
    vehicle_id = models.IntegerField()
    organization = models.CharField(max_length=20, choices=ORGANIZATION_CHOICES)
    correspondence = models.ForeignKey(Correspondence, on_delete=models.SET_NULL, null=True, blank=True)
    plate_number = models.CharField(max_length=10, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    company = models.ForeignKey(CompaniesHistory, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'vehicle'
        unique_together = ['vehicle_id', 'organization']
        verbose_name = 'Vehicle'
        verbose_name_plural = 'Vehicles'
    
    def __str__(self):
        return f"Vehicle {self.vehicle_id} - {self.plate_number}"


class CarPermit(models.Model):
    """Car permits"""
    car_permit_id = models.AutoField(primary_key=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    
    class Meta:
        db_table = 'car_permit'
        verbose_name = 'Car Permit'
        verbose_name_plural = 'Car Permits'
    
    def __str__(self):
        return f"Car Permit {self.car_permit_id} for {self.vehicle}"


# ====================================== CARD PERMITS ======================================
class CardPermits(models.Model):
    """Physical card permits"""
    PERMIT_TYPE_CHOICES = [
        ('Temporary', 'Temporary'),
        ('Permanent', 'Permanent'),
    ]
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Expired', 'Expired'),
        ('Revoked', 'Revoked'),
        ('Lost', 'Lost'),
    ]
    
    permit_id = models.AutoField(primary_key=True)
    permit_number = models.CharField(max_length=50, unique=True, help_text='Unique identifier for the physical card')
    permit_type = models.CharField(max_length=20, choices=PERMIT_TYPE_CHOICES)
    person_guid = models.UUIDField(help_text='FK to People_History. Person the card is issued to.')
    issue_date = models.DateField()
    expiration_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'card_permits'
        verbose_name = 'Card Permit'
        verbose_name_plural = 'Card Permits'
    
    def __str__(self):
        return f"Card {self.permit_number} - {self.permit_type}"


class CardPhotos(models.Model):
    """Photos associated with card permits"""
    photo_id = models.AutoField(primary_key=True)
    permit = models.OneToOneField(CardPermits, on_delete=models.CASCADE, help_text='One photo per permit')
    file_name = models.CharField(max_length=255, help_text='Original file name')
    file_path = models.CharField(max_length=500, help_text='Path or URL to the stored image file')
    file_size_bytes = models.BigIntegerField(blank=True, null=True)
    mime_type = models.CharField(max_length=50, blank=True, null=True, help_text='e.g., image/jpeg, image/png')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'card_photos'
        verbose_name = 'Card Photo'
        verbose_name_plural = 'Card Photos'
    
    def __str__(self):
        return f"Photo for {self.permit.permit_number}"


class Settings(models.Model):
    """System settings model"""
    SETTING_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
        ('file', 'File'),
    ]
    
    key = models.CharField(max_length=100, unique=True, help_text="Setting key/name")
    value = models.TextField(help_text="Setting value")
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='text')
    description = models.TextField(blank=True, help_text="Description of this setting")
    category = models.CharField(max_length=50, default='general', help_text="Setting category")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'settings'
        verbose_name = 'Setting'
        verbose_name_plural = 'Settings'
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.key}: {self.value[:50]}..."
    
    def get_typed_value(self):
        """Return the value converted to its proper type"""
        if self.setting_type == 'boolean':
            return self.value.lower() in ['true', '1', 'yes', 'on']
        elif self.setting_type == 'number':
            try:
                return float(self.value) if '.' in self.value else int(self.value)
            except ValueError:
                return 0
        elif self.setting_type == 'json':
            try:
                import json
                return json.loads(self.value)
            except json.JSONDecodeError:
                return {}
        return self.value
