"""
Card Permits-related Serializers for the SecurityOffice application.

This module contains all serializers related to card permits and photos management:
- CardPhotosSerializer: Serializer for card photos
- CardPermitsSerializer: Serializer for card permits with photos
"""

from rest_framework import serializers
from ..models import (
    CardPhotos,
    CardPermits
)


class CardPhotosSerializer(serializers.ModelSerializer):
    """Serializer for card photos"""
    class Meta:
        model = CardPhotos
        fields = '__all__'
        read_only_fields = ['photo_id', 'uploaded_at']


class CardPermitsSerializer(serializers.ModelSerializer):
    """Serializer for card permits with photos"""
    photo = CardPhotosSerializer(source='cardphotos', read_only=True)
    
    class Meta:
        model = CardPermits
        fields = '__all__'
        read_only_fields = ['permit_id', 'created_at', 'updated_at']
