#!/usr/bin/env python
"""
Script to create default settings for the SecurityOffice system.
Run this script to populate the settings table with initial configuration.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'security_office.settings')
django.setup()

from core.models import Settings

def create_default_settings():
    """Create default settings for the system"""
    
    default_settings = [
        # General Settings
        {
            'key': 'site_name',
            'value': 'إدارة أمن الموقع',
            'setting_type': 'text',
            'category': 'general',
            'description': 'اسم الموقع الذي يظهر في العنوان'
        },
        {
            'key': 'site_description',
            'value': 'نظام إدارة الأمن والسلامة',
            'setting_type': 'text',
            'category': 'general',
            'description': 'وصف الموقع'
        },
        {
            'key': 'max_file_size_mb',
            'value': '10',
            'setting_type': 'number',
            'category': 'files',
            'description': 'الحد الأقصى لحجم الملف بالميجابايت'
        },
        {
            'key': 'allowed_file_types',
            'value': '["pdf", "jpg", "jpeg", "png", "doc", "docx"]',
            'setting_type': 'json',
            'category': 'files',
            'description': 'أنواع الملفات المسموحة'
        },
        
        # Security Settings
        {
            'key': 'session_timeout_minutes',
            'value': '30',
            'setting_type': 'number',
            'category': 'security',
            'description': 'مدة انتهاء الجلسة بالدقائق'
        },
        {
            'key': 'enable_two_factor',
            'value': 'false',
            'setting_type': 'boolean',
            'category': 'security',
            'description': 'تفعيل المصادقة الثنائية'
        },
        {
            'key': 'password_min_length',
            'value': '8',
            'setting_type': 'number',
            'category': 'security',
            'description': 'الحد الأدنى لطول كلمة المرور'
        },
        
        # Notification Settings
        {
            'key': 'email_notifications',
            'value': 'true',
            'setting_type': 'boolean',
            'category': 'notifications',
            'description': 'تفعيل إشعارات البريد الإلكتروني'
        },
        {
            'key': 'sms_notifications',
            'value': 'false',
            'setting_type': 'boolean',
            'category': 'notifications',
            'description': 'تفعيل إشعارات الرسائل النصية'
        },
        {
            'key': 'notification_email',
            'value': 'admin@security-office.com',
            'setting_type': 'text',
            'category': 'notifications',
            'description': 'البريد الإلكتروني للإشعارات'
        },
        
        # Card Settings
        {
            'key': 'card_expiry_warning_days',
            'value': '30',
            'setting_type': 'number',
            'category': 'cards',
            'description': 'عدد الأيام للتحذير من انتهاء البطاقة'
        },
        {
            'key': 'auto_deactivate_expired_cards',
            'value': 'true',
            'setting_type': 'boolean',
            'category': 'cards',
            'description': 'إلغاء تفعيل البطاقات المنتهية تلقائياً'
        },
        
        # Permit Settings
        {
            'key': 'permit_approval_levels',
            'value': '["supervisor", "manager", "director"]',
            'setting_type': 'json',
            'category': 'permits',
            'description': 'مستويات الموافقة على التصاريح'
        },
        {
            'key': 'default_permit_duration_days',
            'value': '90',
            'setting_type': 'number',
            'category': 'permits',
            'description': 'مدة التصريح الافتراضية بالأيام'
        },
        
        # System Settings
        {
            'key': 'backup_frequency_hours',
            'value': '24',
            'setting_type': 'number',
            'category': 'system',
            'description': 'تكرار النسخ الاحتياطي بالساعات'
        },
        {
            'key': 'log_retention_days',
            'value': '365',
            'setting_type': 'number',
            'category': 'system',
            'description': 'مدة الاحتفاظ بالسجلات بالأيام'
        },
        {
            'key': 'maintenance_mode',
            'value': 'false',
            'setting_type': 'boolean',
            'category': 'system',
            'description': 'وضع الصيانة'
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    for setting_data in default_settings:
        setting, created = Settings.objects.get_or_create(
            key=setting_data['key'],
            defaults=setting_data
        )
        
        if created:
            created_count += 1
            print(f"Created setting: {setting_data['key']}")
        else:
            # Update existing setting if needed
            updated = False
            for field in ['value', 'setting_type', 'category', 'description']:
                if getattr(setting, field) != setting_data[field]:
                    setattr(setting, field, setting_data[field])
                    updated = True
            
            if updated:
                setting.save()
                updated_count += 1
                print(f"Updated setting: {setting_data['key']}")
            else:
                print(f"- Setting exists: {setting_data['key']}")
    
    print(f"\nSummary:")
    print(f"   Created: {created_count} settings")
    print(f"   Updated: {updated_count} settings")
    print(f"   Total: {Settings.objects.count()} settings in database")

if __name__ == '__main__':
    print("Creating default settings for SecurityOffice system...")
    create_default_settings()
    print("Default settings creation completed!")
