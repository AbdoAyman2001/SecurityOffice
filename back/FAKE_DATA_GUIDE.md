# Fake Data Population Guide

## Overview
Your SecurityOffice database has been populated with comprehensive fake data for testing all models and API endpoints. This guide explains what data was created and how to use it.

## Generated Data Summary

### 📊 **Data Statistics**
- **50 People Records** with Arabic and English names
- **20 Companies** with different types (Construction, Security, Maintenance, etc.)
- **30 Employment Records** linking people to companies
- **100 Correspondence Records** with attachments and contacts
- **40 Permits** (both person and company permits) with approval decisions
- **15 Accident Records** with detailed descriptions
- **20 Relocation Records** with time periods
- **25 Vehicle Records** with car permits
- **35 Card Permits** with some photo records
- **10 Users** for system access
- **35 Contacts** including organizational approvers

### 🔧 **Management Command**
The fake data is generated using a Django management command:

```bash
# Basic usage (default numbers)
python manage.py populate_fake_data

# Custom numbers
python manage.py populate_fake_data --people 100 --companies 30 --correspondence 200

# Available options:
--people N          # Number of people records (default: 50)
--companies N       # Number of companies (default: 20)  
--correspondence N  # Number of correspondence records (default: 100)
```

### 🗑️ **Clear and Regenerate Data**
The script includes a `clear_existing_data()` method that removes all existing data before creating new fake data. This is useful for testing but **be careful in production**.

## Sample Data Details

### 👥 **People Records**
- **Arabic Names**: أحمد المصري, محمد العربي, علي الشامي, etc.
- **English Names**: Generated using Faker library
- **Nationalities**: Egyptian, Saudi, Jordanian, Lebanese, Syrian, Palestinian
- **Qualifications**: Bachelor, Master, PhD, Diploma, High School, Technical
- **National IDs**: 14-digit numbers
- **Access Areas**: A, B, C, All Areas
- **Version Control**: All records are current (version 1)

### 🏢 **Companies**
- **Types**: Construction, Security, Maintenance, Cleaning, Catering, IT Services
- **Contact Info**: Full addresses generated
- **Version Control**: All current versions

### 📧 **Correspondence**
- **Reference Numbers**: SEC-2025-0001, SEC-2025-0002, etc.
- **Types**: Security Clearance Request, Permit Application, Incident Report, etc.
- **Directions**: Incoming, Outgoing, Internal
- **Priorities**: High, Normal, Low
- **Attachments**: PDF, JPEG, DOCX files with realistic sizes
- **Multiple Contacts**: Sender, Recipient, CC roles

### ✅ **Permits & Approvals**
- **Person Permits**: Linked to individual people
- **Company Permits**: Linked to companies
- **Statuses**: Pending, Active, Rejected, Expired
- **Approval Decisions**: From organizational approvers
- **Realistic Dates**: Effective and expiry dates

### 🚨 **Accidents**
- **Detailed Descriptions**: Realistic incident reports
- **Addresses**: Full location information
- **Date Range**: Last 2 years

### 🏠 **Relocations**
- **Arabic Status**: انتظار (Waiting), حاصل (Approved)
- **Buildings**: A, B, C, D with numbers 1-20
- **Flat Numbers**: 1-50
- **Time Periods**: Start and end dates

### 🚗 **Vehicles**
- **Organizations**: Owner, Contractor
- **License Plates**: Realistic format
- **Car Permits**: Linked to vehicles
- **Company Associations**: Linked to companies

### 🆔 **Card Permits**
- **Permit Numbers**: CARD-00001, CARD-00002, etc.
- **Types**: Temporary, Permanent
- **Statuses**: Active, Expired, Revoked, Lost
- **Photos**: Some cards have associated photo records

## Testing Your API

### 🔍 **Sample API Calls**

#### Get People with Search
```bash
curl "http://127.0.0.1:8000/api/people-history/?search=أحمد"
```

#### Get Active Permits
```bash
curl "http://127.0.0.1:8000/api/permits/active/"
```

#### Get Correspondence by Priority
```bash
curl "http://127.0.0.1:8000/api/correspondence/?priority=high"
```

#### Get Current People Only
```bash
curl "http://127.0.0.1:8000/api/people-history/current_only/"
```

#### Get Permits Expiring Soon
```bash
curl "http://127.0.0.1:8000/api/permits/expiring_soon/"
```

#### Filter by Nationality
```bash
curl "http://127.0.0.1:8000/api/people-history/?nationality=Egyptian"
```

### 📊 **Admin Interface Testing**
1. Visit: `http://127.0.0.1:8000/admin/`
2. Login with: `admin` / `admin123`
3. Browse all the populated data through the organized admin interface

### 🔐 **User Accounts Created**
- **Admin User**: username=`admin`, password=`admin123`
- **Regular Users**: Various usernames with password=`password123`

## Data Relationships

The fake data maintains all the complex relationships from your schema:

- **People ↔ Employment**: 30 people have employment records
- **People ↔ Family**: First 20 people have family relationships
- **Correspondence ↔ Contacts**: Multiple contacts per correspondence
- **Correspondence ↔ Attachments**: Some correspondence has file attachments
- **Permits ↔ Approvals**: All permits have approval decisions
- **Vehicles ↔ Permits**: All vehicles have car permits
- **Cards ↔ Photos**: Some card permits have photos

## Customization

### 🛠️ **Modify the Script**
You can customize the fake data by editing:
`core/management/commands/populate_fake_data.py`

### 📝 **Add More Data Types**
- Modify the lists of sample data (nationalities, job titles, etc.)
- Add more realistic Arabic names
- Customize company types for your specific use case
- Add more correspondence types

### 🔄 **Regenerate Data**
```bash
# Clear and regenerate all data
python manage.py populate_fake_data

# Generate more records
python manage.py populate_fake_data --people 200 --companies 50
```

## Production Considerations

### ⚠️ **Important Notes**
1. **Never run this script in production** with the clear_existing_data enabled
2. **Remove or comment out** the `clear_existing_data()` call for production
3. **Customize the data** to match your real-world scenarios
4. **Test thoroughly** before deploying to production

### 🔒 **Security**
- Change default passwords before production
- Enable proper authentication in API settings
- Remove or secure the fake data generation command

Your SecurityOffice system is now ready for comprehensive testing with realistic data across all models and API endpoints!
