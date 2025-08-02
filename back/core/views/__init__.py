# Import all viewsets from domain-specific modules for backward compatibility
from .people_views import (
    PeopleHistoryViewSet,
    CompaniesHistoryViewSet,
    EmploymentHistoryViewSet,
    FamilyRelationshipsViewSet
)

from .correspondence_views import (
    CorrespondenceViewSet,
    CorrespondenceTypesViewSet,
    ContactsViewSet,
    CorrespondenceTypeProcedureViewSet,
    CorrespondenceStatusLogViewSet
)

from .permits_views import (
    PermitsViewSet,
    ApprovalDecisionsViewSet
)

from .accidents_views import AccidentsViewSet

from .relocation_views import (
    RelocationViewSet,
    RelocationPeriodViewSet
)

from .vehicles_views import (
    VehicleViewSet,
    CarPermitViewSet
)

from .cards_views import (
    CardPermitsViewSet,
    CardPhotosViewSet
)

from .settings_views import SettingsViewSet

from .utils_views import (
    parse_pdf_content,
    parse_filename,
    process_msg_file,
    download_attachment
)

# Make all viewsets available at package level
__all__ = [
    # People
    'PeopleHistoryViewSet',
    'CompaniesHistoryViewSet', 
    'EmploymentHistoryViewSet',
    'FamilyRelationshipsViewSet',
    
    # Correspondence
    'CorrespondenceViewSet',
    'CorrespondenceTypesViewSet',
    'ContactsViewSet',
    'CorrespondenceTypeProcedureViewSet',
    'CorrespondenceStatusLogViewSet',
    
    # Permits
    'PermitsViewSet',
    'ApprovalDecisionsViewSet',
    
    # Accidents
    'AccidentsViewSet',
    
    # Relocation
    'RelocationViewSet',
    'RelocationPeriodViewSet',
    
    # Vehicles
    'VehicleViewSet',
    'CarPermitViewSet',
    
    # Cards
    'CardPermitsViewSet',
    'CardPhotosViewSet',
    
    # Settings
    'SettingsViewSet',
    
    # Utils
    'parse_pdf_content',
    'parse_filename',
    'process_msg_file',
    'download_attachment'
]
