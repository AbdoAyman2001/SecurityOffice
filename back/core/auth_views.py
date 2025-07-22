from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from .serializers import (
    LoginSerializer, LoginResponseSerializer, ChangePasswordSerializer,
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, 
    UserPermissionsSerializer
)
from .permissions import IsAdminUser, IsOwnerOrAdmin

User = get_user_model()


class LoginView(APIView):
    """
    User login endpoint
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            remember_me = serializer.validated_data.get('remember_me', False)
            
            user = authenticate(username=username, password=password)
            
            if user and user.is_active:
                # Create or get token
                token, created = Token.objects.get_or_create(user=user)
                
                # Update user session info
                with transaction.atomic():
                    user.is_active_session = True
                    user.last_login_ip = self.get_client_ip(request)
                    user.save(update_fields=['is_active_session', 'last_login_ip'])
                
                # Set session expiry based on remember_me
                if not remember_me:
                    request.session.set_expiry(0)  # Session expires when browser closes
                else:
                    request.session.set_expiry(1209600)  # 2 weeks
                
                # Get user permissions
                permissions_data = {
                    'can_create_correspondence': user.can_create_correspondence(),
                    'can_edit_correspondence': user.can_edit_correspondence(),
                    'can_delete_correspondence': user.can_delete_correspondence(),
                    'can_manage_users': user.can_manage_users(),
                    'can_view_reports': user.can_view_reports(),
                    'can_manage_permits': user.can_manage_permits(),
                    'is_admin': user.is_admin(),
                    'is_normal_user': user.is_normal_user(),
                }
                
                response_data = {
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'message': 'تم تسجيل الدخول بنجاح',
                    'permissions': permissions_data
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'بيانات تسجيل الدخول غير صحيحة'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class LogoutView(APIView):
    """
    User logout endpoint
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Update user session status
            with transaction.atomic():
                request.user.is_active_session = False
                request.user.save(update_fields=['is_active_session'])
            
            # Delete the user's token
            try:
                token = Token.objects.get(user=request.user)
                token.delete()
            except Token.DoesNotExist:
                pass
            
            # Logout from Django session
            logout(request)
            
            return Response({
                'message': 'تم تسجيل الخروج بنجاح'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'حدث خطأ أثناء تسجيل الخروج'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(APIView):
    """
    Get and update user profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(
            request.user, 
            data=request.data, 
            context={'request': request},
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'user': UserSerializer(request.user).data,
                'message': 'تم تحديث الملف الشخصي بنجاح'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Change user password
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'error': 'كلمة المرور الحالية غير صحيحة'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Update token (invalidate old sessions)
            try:
                token = Token.objects.get(user=user)
                token.delete()
                Token.objects.create(user=user)
            except Token.DoesNotExist:
                Token.objects.create(user=user)
            
            return Response({
                'message': 'تم تغيير كلمة المرور بنجاح'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPermissionsView(APIView):
    """
    Get current user permissions
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        permissions_data = {
            'can_create_correspondence': request.user.can_create_correspondence(),
            'can_edit_correspondence': request.user.can_edit_correspondence(),
            'can_delete_correspondence': request.user.can_delete_correspondence(),
            'can_manage_users': request.user.can_manage_users(),
            'can_view_reports': request.user.can_view_reports(),
            'can_manage_permits': request.user.can_manage_permits(),
            'is_admin': request.user.is_admin(),
            'is_normal_user': request.user.is_normal_user(),
        }
        
        serializer = UserPermissionsSerializer(permissions_data)
        return Response(serializer.data)


class UserManagementView(APIView):
    """
    User management endpoints (Admin only)
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """List all users"""
        users = User.objects.all().order_by('-date_joined')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """Create new user"""
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserSerializer(user).data,
                'message': 'تم إنشاء المستخدم بنجاح'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    """
    User detail management (Admin only)
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get(self, request, user_id):
        """Get user details"""
        try:
            user = User.objects.get(id=user_id)
            self.check_object_permissions(request, user)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({
                'error': 'المستخدم غير موجود'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, user_id):
        """Update user"""
        try:
            user = User.objects.get(id=user_id)
            self.check_object_permissions(request, user)
            
            serializer = UserUpdateSerializer(
                user, 
                data=request.data, 
                context={'request': request},
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'user': UserSerializer(user).data,
                    'message': 'تم تحديث المستخدم بنجاح'
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except User.DoesNotExist:
            return Response({
                'error': 'المستخدم غير موجود'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, user_id):
        """Delete user (Admin only)"""
        if not request.user.is_admin():
            return Response({
                'error': 'غير مصرح لك بحذف المستخدمين'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            
            # Prevent self-deletion
            if user.id == request.user.id:
                return Response({
                    'error': 'لا يمكنك حذف حسابك الخاص'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.delete()
            return Response({
                'message': 'تم حذف المستخدم بنجاح'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'المستخدم غير موجود'
            }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_auth_status(request):
    """
    Check if user is authenticated and return basic info
    """

    # --- DEBUGGING LINE START ---
    print("\n--- Incoming Request Headers ---")
    for header, value in request.META.items():
        if header.startswith('HTTP_'): # HTTP headers are prefixed with HTTP_ in META
            # Convert HTTP_AUTHORIZATION to Authorization for readability
            readable_header = header[5:].replace('_', '-').upper()
            print(f"{readable_header}: {value}")
        elif header == 'CONTENT_TYPE' or header == 'CONTENT_LENGTH':
            print(f"{header}: {value}")
    print("----------------------------\n")

    print(f"Request User: {request.user}")
    print(f"Is Authenticated: {request.user.is_authenticated}")
    # --- DEBUGGING LINE END ---
        
    return Response({
        'authenticated': True,
        'user': UserSerializer(request.user).data,
        'permissions': {
            'can_create_correspondence': request.user.can_create_correspondence(),
            'can_edit_correspondence': request.user.can_edit_correspondence(),
            'can_delete_correspondence': request.user.can_delete_correspondence(),
            'can_manage_users': request.user.can_manage_users(),
            'can_view_reports': request.user.can_view_reports(),
            'can_manage_permits': request.user.can_manage_permits(),
            'is_admin': request.user.is_admin(),
            'is_normal_user': request.user.is_normal_user(),
        }
    })
