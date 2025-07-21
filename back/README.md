# SecurityOffice Django Backend

A comprehensive Django backend system for managing security office operations including people management, correspondence tracking, permits, accidents, relocations, vehicles, and card permits.

## Features

- **People Management**: Track people's information with version control, including employees and family members
- **Employment History**: Maintain employment records with company associations
- **Correspondence System**: Manage incoming/outgoing correspondence with attachments and procedures
- **Permits & Approvals**: Handle permit requests and approval workflows
- **Accident Tracking**: Record and manage accident incidents
- **Relocation Management**: Track relocation requests and periods
- **Vehicle Management**: Manage vehicle permits and registrations
- **Card Permits**: Issue and manage physical access cards with photos

## Database Schema

The system implements a comprehensive database schema with:
- Version control for historical data
- UUID-based person identification
- File attachment support
- Multi-language support (Arabic/English names)
- Enum-based status tracking
- Relationship management between entities

## Setup Instructions

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Database Configuration**
   - Create a PostgreSQL database named `security_office`
   - Update the `.env` file with your database credentials:
     ```
     DB_NAME=security_office
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_HOST=localhost
     DB_PORT=5432
     ```

3. **Run Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create Superuser**
   ```bash
   python manage.py createsuperuser
   ```

5. **Run Development Server**
   ```bash
   python manage.py runserver
   ```

## Models Overview

### People & Employment
- `PeopleHistory`: Person information with version control
- `CompaniesHistory`: Company information with version control
- `EmploymentHistory`: Employment records linking people to companies
- `FamilyRelationships`: Family member relationships

### Correspondence
- `Correspondence`: Main correspondence records
- `CorrespondenceTypes`: Types of correspondence
- `Contacts`: Contact information for correspondence
- `Attachments`: File attachments
- `CorrespondenceProcedures`: Procedure tracking

### Permits & Approvals
- `Permits`: Permit requests for people or companies
- `ApprovalDecisions`: Approval workflow tracking

### Other Modules
- `Accidents`: Accident incident records
- `Relocation`: Relocation requests and periods
- `Vehicle`: Vehicle registration and permits
- `CardPermits`: Physical access card management
- `CardPhotos`: Photos associated with cards

## Admin Interface

The system includes a comprehensive Django admin interface with:
- Organized sections for each module
- Inline editing for related models
- Advanced filtering and search capabilities
- Fieldset organization for better UX

## API Endpoints

The system is configured with Django REST Framework for API development. Future API endpoints will be added for:
- CRUD operations for all models
- Authentication and permissions
- File upload handling
- Search and filtering capabilities

## Technology Stack

- **Backend**: Django 4.2.7
- **Database**: PostgreSQL (with UUID support)
- **API**: Django REST Framework
- **File Handling**: Pillow for image processing
- **CORS**: django-cors-headers for frontend integration
- **Configuration**: python-decouple for environment variables

## Security Considerations

- Custom User model for authentication
- UUID-based person identification for privacy
- File upload validation
- CORS configuration for frontend integration
- Environment-based configuration management
