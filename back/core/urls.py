from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PeopleHistoryViewSet, CompaniesHistoryViewSet,
    EmploymentHistoryViewSet, FamilyRelationshipsViewSet,
    CorrespondenceTypesViewSet, ContactsViewSet, CorrespondenceViewSet,
    CorrespondenceContactsViewSet, AttachmentsViewSet,
    CorrespondenceProceduresViewSet, PermitsViewSet, ApprovalDecisionsViewSet,
    AccidentsViewSet, RelocationViewSet, RelocationPeriodViewSet,
    VehicleViewSet, CarPermitViewSet, CardPermitsViewSet, CardPhotosViewSet,
    SettingsViewSet
)
from .auth_views import (
    LoginView, LogoutView, UserProfileView, ChangePasswordView,
    UserPermissionsView, UserManagementView, UserDetailView,
    check_auth_status
)

# Create a router and register our viewsets with it
router = DefaultRouter()

# User endpoints (commented out - no UserViewSet in views.py yet)
# router.register(r'users', UserViewSet)

# People endpoints
router.register(r'people-history', PeopleHistoryViewSet)
router.register(r'companies-history', CompaniesHistoryViewSet)
router.register(r'employment-history', EmploymentHistoryViewSet)
router.register(r'family-relationships', FamilyRelationshipsViewSet)

# Correspondence endpoints
router.register(r'correspondence-types', CorrespondenceTypesViewSet)
router.register(r'contacts', ContactsViewSet)
router.register(r'correspondence', CorrespondenceViewSet)
router.register(r'correspondence-contacts', CorrespondenceContactsViewSet)
router.register(r'attachments', AttachmentsViewSet)
router.register(r'correspondence-procedures', CorrespondenceProceduresViewSet)

# Approval endpoints
router.register(r'permits', PermitsViewSet)
router.register(r'approval-decisions', ApprovalDecisionsViewSet)

# Accidents endpoints
router.register(r'accidents', AccidentsViewSet)

# Relocation endpoints
router.register(r'relocations', RelocationViewSet)
router.register(r'relocation-periods', RelocationPeriodViewSet)

# Vehicle endpoints
router.register(r'vehicles', VehicleViewSet)
router.register(r'car-permits', CarPermitViewSet)

# Card permits endpoints
router.register(r'card-permits', CardPermitsViewSet)
router.register(r'card-photos', CardPhotosViewSet)

# Settings endpoints
router.register(r'settings', SettingsViewSet)

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    
    # Authentication endpoints
    path('api/auth/login/', LoginView.as_view(), name='auth_login'),
    path('api/auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/auth/profile/', UserProfileView.as_view(), name='auth_profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('api/auth/permissions/', UserPermissionsView.as_view(), name='auth_permissions'),
    path('api/auth/check/', check_auth_status, name='auth_check'),
    
    # User management endpoints (Admin only)
    path('api/auth/users/', UserManagementView.as_view(), name='auth_users'),
    path('api/auth/users/<int:user_id>/', UserDetailView.as_view(), name='auth_user_detail'),
]
