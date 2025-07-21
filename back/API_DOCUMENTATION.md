# SecurityOffice REST API Documentation

## Base URL
```
http://127.0.0.1:8000/api/
```

## Authentication
Currently configured for **development mode** with `AllowAny` permissions. For production, you should implement proper authentication (JWT, Session, etc.).

## API Overview

The SecurityOffice API provides comprehensive endpoints for managing all aspects of the security office system. All endpoints support standard REST operations (GET, POST, PUT, PATCH, DELETE) and include advanced filtering, searching, and pagination capabilities.

## Available Endpoints

### 🔐 User Management
- **`/api/users/`** - User management
  - Supports: Search by username, email, first_name, last_name
  - Filters: is_active, is_staff
  - Ordering: username, date_joined

### 👥 People Management
- **`/api/people-history/`** - People records with version control
  - Supports: Search by full_name_arabic, full_name_english, national_id, person_guid
  - Filters: is_current, nationality, alive, version
  - Ordering: full_name_arabic, start_date, version
  - **Custom Actions:**
    - `GET /api/people-history/current_only/` - Get only current versions
    - `GET /api/people-history/{id}/history/` - Get all versions of a person

- **`/api/companies-history/`** - Company records with version control
  - Supports: Search by company_name, company_type
  - Filters: is_current, company_type
  - Ordering: company_name, start_date
  - **Custom Actions:**
    - `GET /api/companies-history/current_only/` - Get only current versions

- **`/api/employment-history/`** - Employment records
  - Supports: Search by person_guid, job_title, company__company_name
  - Filters: still_hired, is_current, company
  - Ordering: start_date, job_title

- **`/api/family-relationships/`** - Family member relationships
  - Supports: Search by worker_person_guid, family_member_person_guid
  - Filters: relationship_type, status
  - Ordering: relationship_type

### 📧 Correspondence Management
- **`/api/correspondence-types/`** - Types of correspondence
  - Supports: Search by type_name
  - Ordering: type_name

- **`/api/contacts/`** - Contact management
  - Supports: Search by name
  - Filters: contact_type, is_approver
  - Ordering: name, contact_type
  - **Custom Actions:**
    - `GET /api/contacts/approvers/` - Get only approver contacts

- **`/api/correspondence/`** - Main correspondence records
  - Supports: Search by reference_number, subject, summary
  - Filters: direction, priority, type, correspondence_date
  - Ordering: correspondence_date, reference_number, priority
  - **Custom Actions:**
    - `GET /api/correspondence/summary/` - Get correspondence summary for listings

- **`/api/correspondence-contacts/`** - Correspondence-contact relationships
  - Filters: role, correspondence, contact
  - Ordering: correspondence, role

- **`/api/attachments/`** - File attachments
  - Supports: Search by file_name
  - Filters: file_type, correspondence
  - Ordering: file_name, file_size

- **`/api/correspondence-procedures/`** - Procedure tracking
  - Supports: Search by description, notes
  - Filters: status, responsible_person, procedure_date
  - Ordering: procedure_date, status

### ✅ Permits & Approvals
- **`/api/permits/`** - Permit management
  - Supports: Search by person_guid, company__company_name
  - Filters: permit_holder_type, permit_status, effective_date, expiry_date
  - Ordering: effective_date, expiry_date, permit_status
  - **Custom Actions:**
    - `GET /api/permits/active/` - Get only active permits
    - `GET /api/permits/expiring_soon/` - Get permits expiring in next 30 days

- **`/api/approval-decisions/`** - Approval workflow tracking
  - Filters: decision_status, approver_contact, permit, decision_date
  - Ordering: decision_date, decision_status

### 🚨 Accidents
- **`/api/accidents/`** - Accident incident records
  - Supports: Search by person_guid, description, address
  - Filters: date
  - Ordering: date

### 🏠 Relocation Management
- **`/api/relocations/`** - Relocation requests
  - Supports: Search by person_guid
  - Filters: approval_status, building_letter, building_number
  - Ordering: building_number, flat_number

- **`/api/relocation-periods/`** - Relocation time periods
  - Filters: relocation, start_date, end_date
  - Ordering: start_date, end_date

### 🚗 Vehicle Management
- **`/api/vehicles/`** - Vehicle registration
  - Supports: Search by plate_number, vehicle_id
  - Filters: organization, company, start_date, end_date
  - Ordering: vehicle_id, start_date

- **`/api/car-permits/`** - Car permits
  - Filters: vehicle, start_date, end_date
  - Ordering: start_date, end_date

### 🆔 Card Permits
- **`/api/card-permits/`** - Physical access card management
  - Supports: Search by permit_number, person_guid
  - Filters: permit_type, status, issue_date, expiration_date
  - Ordering: issue_date, expiration_date, permit_number
  - **Custom Actions:**
    - `GET /api/card-permits/active/` - Get only active card permits
    - `GET /api/card-permits/expiring_soon/` - Get cards expiring in next 30 days

- **`/api/card-photos/`** - Card photos
  - Supports: Search by file_name
  - Filters: permit, mime_type
  - Ordering: uploaded_at, file_name

## API Features

### 🔍 Filtering
All endpoints support filtering using query parameters:
```
GET /api/people-history/?is_current=true&nationality=Egyptian
```

### 🔎 Searching
Use the `search` parameter for text-based searches:
```
GET /api/people-history/?search=Ahmed
```

### 📊 Ordering
Use the `ordering` parameter to sort results:
```
GET /api/correspondence/?ordering=-correspondence_date
```
Use `-` prefix for descending order.

### 📄 Pagination
All list endpoints are paginated with 20 items per page by default:
```json
{
  "count": 150,
  "next": "http://127.0.0.1:8000/api/people-history/?page=2",
  "previous": null,
  "results": [...]
}
```

## Example API Calls

### Get Current People Records
```bash
curl "http://127.0.0.1:8000/api/people-history/current_only/"
```

### Search Correspondence
```bash
curl "http://127.0.0.1:8000/api/correspondence/?search=security&direction=Incoming"
```

### Get Active Permits Expiring Soon
```bash
curl "http://127.0.0.1:8000/api/permits/expiring_soon/"
```

### Create New Person Record
```bash
curl -X POST "http://127.0.0.1:8000/api/people-history/" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name_arabic": "أحمد محمد علي",
    "full_name_english": "Ahmed Mohamed Ali",
    "nationality": "Egyptian",
    "national_id": "12345678901234",
    "start_date": "2025-07-20T10:00:00Z",
    "is_current": true,
    "version": 1
  }'
```

### Update Permit Status
```bash
curl -X PATCH "http://127.0.0.1:8000/api/permits/1/" \
  -H "Content-Type: application/json" \
  -d '{
    "permit_status": "Active",
    "effective_date": "2025-07-20"
  }'
```

## Response Format

### Success Response
```json
{
  "person_record_id": 1,
  "person_guid": "550e8400-e29b-41d4-a716-446655440000",
  "full_name_arabic": "أحمد محمد علي",
  "full_name_english": "Ahmed Mohamed Ali",
  "nationality": "Egyptian",
  "is_current": true,
  "version": 1
}
```

### Error Response
```json
{
  "detail": "Not found."
}
```

### Validation Error Response
```json
{
  "full_name_arabic": ["This field is required."],
  "start_date": ["This field is required."]
}
```

## Data Relationships

The API maintains all relationships from your original database schema:

- **People ↔ Employment**: Person GUID links to employment history
- **People ↔ Family**: Worker and family member relationships
- **Correspondence ↔ Attachments**: One-to-many relationship
- **Permits ↔ Approvals**: One-to-many approval decisions
- **Cards ↔ Photos**: One-to-one relationship
- **Vehicles ↔ Permits**: One-to-many car permits

## Security Considerations

### For Production Deployment:
1. **Enable Authentication**: Change `AllowAny` to `IsAuthenticated`
2. **Add Permission Classes**: Implement role-based permissions
3. **API Rate Limiting**: Add throttling for API endpoints
4. **HTTPS**: Use HTTPS in production
5. **CORS**: Configure proper CORS settings for your frontend domain

### Example Production Settings:
```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day'
    }
}
```

## Next Steps

1. **Authentication**: Implement JWT or session-based authentication
2. **Permissions**: Add role-based access control
3. **File Uploads**: Implement proper file handling for attachments and photos
4. **API Documentation**: Add Swagger/OpenAPI documentation
5. **Testing**: Create comprehensive API tests
6. **Caching**: Add Redis caching for frequently accessed data
