from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access certain views.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_admin()
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admin users to access it.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access any object
        if request.user.is_admin():
            return True
        
        # Users can only access their own objects
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False


class CanCreateCorrespondence(permissions.BasePermission):
    """
    Permission to check if user can create correspondence
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_create_correspondence()
        )


class CanEditCorrespondence(permissions.BasePermission):
    """
    Permission to check if user can edit correspondence
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_edit_correspondence()
        )


class CanDeleteCorrespondence(permissions.BasePermission):
    """
    Permission to check if user can delete correspondence
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_delete_correspondence()
        )


class CanManagePermits(permissions.BasePermission):
    """
    Permission to check if user can manage permits
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_manage_permits()
        )


class CanViewReports(permissions.BasePermission):
    """
    Permission to check if user can view reports
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_view_reports()
        )


class ReadOnlyOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow read-only access to normal users
    and full access to admin users.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin users have full access
        if request.user.is_admin():
            return True
        
        # Normal users have read-only access
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Others can only read.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin users can edit any object
        if request.user.is_admin():
            return True
        
        # Write permissions are only allowed to the owner of the object.
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False
