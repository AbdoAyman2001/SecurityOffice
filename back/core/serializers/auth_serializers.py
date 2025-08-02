"""
Authentication and User-related Serializers for the SecurityOffice application.

This module contains all serializers related to user authentication and management:
- UserSerializer: Complete user serializer with role information
- LoginSerializer: Serializer for user login
- LoginResponseSerializer: Serializer for login response
- ChangePasswordSerializer: Serializer for changing password
- UserCreateSerializer: Serializer for creating new users (admin only)
- UserUpdateSerializer: Serializer for updating user information
- UserPermissionsSerializer: Serializer for user permissions
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()


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
