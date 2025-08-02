# Import all serializers from domain-specific modules for backward compatibility

# User/Auth serializers
from .auth_serializers import (
    UserSerializer,
    LoginSerializer,
    LoginResponseSerializer,
    ChangePasswordSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserPermissionsSerializer
)

# People serializers
from .people_serializers import (
    PeopleHistorySerializer,
    CompaniesHistorySerializer,
    EmploymentHistorySerializer,
    FamilyRelationshipsSerializer,
    PeopleHistorySummarySerializer
)

# Correspondence serializers
from .correspondence_serializers import (
    CorrespondenceTypesSerializer,
    ContactsSerializer,
    AttachmentsSerializer,
    CorrespondenceTypeProcedureSerializer,
    CorrespondenceStatusLogSerializer,
    CorrespondenceSerializer,
    CorrespondenceSummarySerializer
)

# Permits serializers
from .permits_serializers import (
    ApprovalDecisionsSerializer,
    PermitsSerializer
)

# Other domain serializers
from .accidents_serializers import AccidentsSerializer
from .relocation_serializers import (
    RelocationPeriodSerializer,
    RelocationSerializer
)
from .vehicles_serializers import (
    CarPermitSerializer,
    VehicleSerializer
)
from .cards_serializers import (
    CardPhotosSerializer,
    CardPermitsSerializer
)
from .settings_serializers import SettingsSerializer

# Make all serializers available at package level
__all__ = [
    # User/Auth
    'UserSerializer',
    'LoginSerializer',
    'LoginResponseSerializer',
    'ChangePasswordSerializer',
    'UserCreateSerializer',
    'UserUpdateSerializer',
    'UserPermissionsSerializer',
    
    # People
    'PeopleHistorySerializer',
    'CompaniesHistorySerializer',
    'EmploymentHistorySerializer',
    'FamilyRelationshipsSerializer',
    'PeopleHistorySummarySerializer',
    
    # Correspondence
    'CorrespondenceTypesSerializer',
    'ContactsSerializer',
    'AttachmentsSerializer',
    'CorrespondenceTypeProcedureSerializer',
    'CorrespondenceStatusLogSerializer',
    'CorrespondenceSerializer',
    'CorrespondenceSummarySerializer',
    
    # Permits
    'ApprovalDecisionsSerializer',
    'PermitsSerializer',
    
    # Accidents
    'AccidentsSerializer',
    
    # Relocation
    'RelocationPeriodSerializer',
    'RelocationSerializer',
    
    # Vehicles
    'CarPermitSerializer',
    'VehicleSerializer',
    
    # Cards
    'CardPhotosSerializer',
    'CardPermitsSerializer',
    
    # Settings
    'SettingsSerializer'
]
