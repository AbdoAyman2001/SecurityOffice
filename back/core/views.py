from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.files.base import ContentFile
import os
import tempfile
import json
import extract_msg
import email
from email import policy
import mimetypes
import re
from .models import (
    PeopleHistory, CompaniesHistory, EmploymentHistory, FamilyRelationships,
    CorrespondenceTypes, Contacts, Correspondence, CorrespondenceContacts,
    Attachments, Permits, ApprovalDecisions,
    Accidents, Relocation, RelocationPeriod, Vehicle, CarPermit,
    CardPermits, CardPhotos, Settings, CorrespondenceTypeProcedure, CorrespondenceStatusLog
)
from .serializers import (
    PeopleHistorySerializer, CompaniesHistorySerializer, EmploymentHistorySerializer,
    FamilyRelationshipsSerializer, CorrespondenceTypesSerializer, ContactsSerializer,
    CorrespondenceSerializer, CorrespondenceContactsSerializer, AttachmentsSerializer,
    PermitsSerializer, ApprovalDecisionsSerializer,
    AccidentsSerializer, RelocationSerializer, RelocationPeriodSerializer,
    VehicleSerializer, CarPermitSerializer, CardPermitsSerializer,
    CardPhotosSerializer, SettingsSerializer, CorrespondenceTypeProcedureSerializer, CorrespondenceStatusLogSerializer
)


# ====================================== PEOPLE VIEWSETS ======================================
class PeopleHistoryViewSet(viewsets.ModelViewSet):
    queryset = PeopleHistory.objects.all()
    serializer_class = PeopleHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_current', 'nationality', 'alive']
    search_fields = ['full_name_arabic', 'full_name_english', 'national_id']
    ordering_fields = ['start_date', 'full_name_arabic']
    ordering = ['-start_date']


class CompaniesHistoryViewSet(viewsets.ModelViewSet):
    queryset = CompaniesHistory.objects.all()
    serializer_class = CompaniesHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_current', 'company_type']
    search_fields = ['company_name']


class EmploymentHistoryViewSet(viewsets.ModelViewSet):
    queryset = EmploymentHistory.objects.all()
    serializer_class = EmploymentHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['still_hired', 'is_current']
    search_fields = ['person_guid', 'job_title']


class FamilyRelationshipsViewSet(viewsets.ModelViewSet):
    queryset = FamilyRelationships.objects.all()
    serializer_class = FamilyRelationshipsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['relationship_type', 'status']


# ====================================== CORRESPONDENCE VIEWSETS ======================================
class CorrespondenceTypesViewSet(viewsets.ModelViewSet):
    queryset = CorrespondenceTypes.objects.all()
    serializer_class = CorrespondenceTypesSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['type_name']


class ContactsViewSet(viewsets.ModelViewSet):
    queryset = Contacts.objects.all()
    serializer_class = ContactsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['contact_type', 'is_approver']
    search_fields = ['name']


class CorrespondenceViewSet(viewsets.ModelViewSet):
    queryset = Correspondence.objects.all()
    serializer_class = CorrespondenceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['direction', 'priority', 'type']
    search_fields = ['reference_number', 'subject', 'summary']
    ordering_fields = ['correspondence_date']
    ordering = ['-correspondence_date']


class CorrespondenceContactsViewSet(viewsets.ModelViewSet):
    queryset = CorrespondenceContacts.objects.all()
    serializer_class = CorrespondenceContactsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['role']


class AttachmentsViewSet(viewsets.ModelViewSet):
    queryset = Attachments.objects.all()
    serializer_class = AttachmentsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['file_type']
    search_fields = ['file_name']


class CorrespondenceTypeProcedureViewSet(viewsets.ModelViewSet):
    """ViewSet for managing correspondence type procedures"""
    queryset = CorrespondenceTypeProcedure.objects.all()
    serializer_class = CorrespondenceTypeProcedureSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['correspondence_type', 'is_initial', 'is_final']
    search_fields = ['procedure_name', 'description']
    ordering_fields = ['procedure_order', 'procedure_name']
    ordering = ['correspondence_type', 'procedure_order']


class CorrespondenceStatusLogViewSet(viewsets.ModelViewSet):
    """ViewSet for managing correspondence status change logs"""
    queryset = CorrespondenceStatusLog.objects.all()
    serializer_class = CorrespondenceStatusLogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['correspondence', 'from_status', 'to_status', 'changed_by']
    search_fields = ['change_reason', 'correspondence__reference_number']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


# ====================================== PERMITS VIEWSETS ======================================
class PermitsViewSet(viewsets.ModelViewSet):
    queryset = Permits.objects.all()
    serializer_class = PermitsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['permit_holder_type', 'permit_status']
    search_fields = ['person_guid']
    ordering_fields = ['effective_date', 'expiry_date']
    ordering = ['-effective_date']


class ApprovalDecisionsViewSet(viewsets.ModelViewSet):
    queryset = ApprovalDecisions.objects.all()
    serializer_class = ApprovalDecisionsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['decision_status']
    ordering_fields = ['decision_date']
    ordering = ['-decision_date']


# ====================================== ACCIDENTS VIEWSETS ======================================
class AccidentsViewSet(viewsets.ModelViewSet):
    queryset = Accidents.objects.all()
    serializer_class = AccidentsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['person_guid', 'description', 'address']
    ordering_fields = ['date']
    ordering = ['-date']


# ====================================== RELOCATION VIEWSETS ======================================
class RelocationViewSet(viewsets.ModelViewSet):
    queryset = Relocation.objects.all()
    serializer_class = RelocationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['approval_status', 'building_letter']
    search_fields = ['person_guid']


class RelocationPeriodViewSet(viewsets.ModelViewSet):
    queryset = RelocationPeriod.objects.all()
    serializer_class = RelocationPeriodSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']


# ====================================== VEHICLES VIEWSETS ======================================
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['organization']
    search_fields = ['plate_number', 'vehicle_id']
    ordering_fields = ['start_date']
    ordering = ['-start_date']


class CarPermitViewSet(viewsets.ModelViewSet):
    queryset = CarPermit.objects.all()
    serializer_class = CarPermitSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']


# ====================================== CARD PERMITS VIEWSETS ======================================
class CardPermitsViewSet(viewsets.ModelViewSet):
    queryset = CardPermits.objects.all()
    serializer_class = CardPermitsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['permit_type', 'status']
    search_fields = ['permit_number', 'person_guid']
    ordering_fields = ['issue_date', 'expiration_date']
    ordering = ['-issue_date']


class CardPhotosViewSet(viewsets.ModelViewSet):
    queryset = CardPhotos.objects.all()
    serializer_class = CardPhotosSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['mime_type']
    search_fields = ['file_name']


# ====================================== SETTINGS VIEWSETS ======================================
class SettingsViewSet(viewsets.ModelViewSet):
    queryset = Settings.objects.all()
    serializer_class = SettingsSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['setting_type', 'category', 'is_active']
    search_fields = ['key', 'description']
    ordering_fields = ['category', 'key', 'updated_at']
    ordering = ['category', 'key']


# ====================================== FILE PROCESSING ======================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_pdf_content(request):
    """
    Parse PDF file content to extract Russian letter reference number and date.
    Extracts information directly from the PDF document content.
    """
    if 'file' not in request.FILES:
        return Response(
            {'error': 'PDF file is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    pdf_file = request.FILES['file']
    
    # Validate file type
    if not pdf_file.name.lower().endswith('.pdf'):
        return Response(
            {'error': 'Only PDF files are supported'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        import PyPDF2
        from io import BytesIO
        from datetime import datetime
        
        # Read PDF content
        pdf_content = BytesIO(pdf_file.read())
        pdf_reader = PyPDF2.PdfReader(pdf_content)
        
        # Extract text from first page (where reference and date are typically located)
        if len(pdf_reader.pages) == 0:
            return Response({
                'success': True,
                'parsed': False,
                'message': 'PDF file appears to be empty'
            }, status=status.HTTP_200_OK)
        
        first_page = pdf_reader.pages[0]
        text = first_page.extract_text()
        
        # Split text into lines for processing
        lines = text.split('\n')
        
        # Look for reference number pattern in the first few lines
        # Russian letters typically have reference like: "رقم: 123/ABC/2025" or "Ref: 123/ABC/2025"
        reference_number = None
        correspondence_date = None
        
        # Search for reference number patterns
        ref_patterns = [
            r'(?:رقم|Ref|Reference|REF)\s*:?\s*([A-Z0-9/\-]+)',  # Arabic "رقم" or English "Ref"
            r'([A-Z0-9]+/[A-Z0-9/\-]+)',  # Pattern like "123/ABC/2025"
            r'No\.?\s*([A-Z0-9/\-]+)',  # "No. 123/ABC"
        ]
        
        # Search for date patterns
        date_patterns = [
            r'(?:تاريخ|Date|DATE)\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})',  # Arabic "تاريخ" or English "Date"
            r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})',  # Direct date pattern
            r'(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})',  # ISO date pattern
        ]
        
        # Process first 10 lines (header area)
        for i, line in enumerate(lines[:10]):
            line = line.strip()
            if not line:
                continue
                
            # Try to find reference number
            if not reference_number:
                for pattern in ref_patterns:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        reference_number = match.group(1).strip()
                        break
            
            # Try to find date
            if not correspondence_date:
                for pattern in date_patterns:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        date_str = match.group(1).strip()
                        # Try to parse the date
                        try:
                            # Handle different date formats
                            if '/' in date_str:
                                parts = date_str.split('/')
                            elif '-' in date_str:
                                parts = date_str.split('-')
                            else:
                                continue
                                
                            if len(parts) == 3:
                                # Determine date format
                                if len(parts[0]) == 4:  # YYYY/MM/DD or YYYY-MM-DD
                                    year, month, day = parts
                                else:  # DD/MM/YYYY or MM/DD/YYYY
                                    # Assume DD/MM/YYYY for Russian letters
                                    day, month, year = parts
                                
                                # Validate and format
                                parsed_date = datetime(int(year), int(month), int(day))
                                correspondence_date = parsed_date.strftime('%Y-%m-%d')
                                break
                        except (ValueError, IndexError):
                            continue
        
        # Determine parsing success and confidence
        if reference_number or correspondence_date:
            confidence = 'high' if (reference_number and correspondence_date) else 'medium'
            
            return Response({
                'success': True,
                'parsed': True,
                'method': 'pdf_content_extraction',
                'data': {
                    'reference_number': reference_number,
                    'correspondence_date': correspondence_date,
                    'confidence': confidence,
                    'extracted_from': 'pdf_content'
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': True,
                'parsed': False,
                'message': 'No reference number or date found in PDF content',
                'debug_info': {
                    'first_10_lines': lines[:10] if len(lines) >= 10 else lines
                }
            }, status=status.HTTP_200_OK)
            
    except ImportError:
        return Response(
            {'error': 'PyPDF2 library is not installed. Please install it to process PDF files.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to parse PDF content: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_filename(request):
    """
    Parse filename to extract correspondence information (fallback method).
    This is used as a fallback when PDF content extraction is not available.
    """
    filename = request.data.get('filename')
    if not filename:
        return Response(
            {'error': 'Filename is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check if this looks like a Russian letter PDF filename
        name_without_ext = filename
        if filename.lower().endswith('.pdf'):
            name_without_ext = filename[:-4]
        
        # Pattern for Russian letters: [number] [space] [dd] [space] [8-digit-date]_[subject]
        # Example: "7612 dd 22072025_On the Site Access for Contractor's Vehicle"
        pattern = r'^(\d+)\s+[a-z]+\s+(\d{8})[_ ]?(.*)$'
        match = re.match(pattern, name_without_ext, re.IGNORECASE)
        
        if match:
            ref_number, date_str, subject = match.groups()
            
            # Parse date from DDMMYYYY format
            try:
                day = date_str[:2]
                month = date_str[2:4]
                year = date_str[4:8]
                formatted_date = f'{year}-{month}-{day}'
                
                # Validate date
                from datetime import datetime
                datetime.strptime(formatted_date, '%Y-%m-%d')
                
                return Response({
                    'success': True,
                    'parsed': True,
                    'method': 'filename_pattern',
                    'data': {
                        'reference_number': ref_number,
                        'correspondence_date': formatted_date,
                        'subject': subject.strip(),
                        'confidence': 'medium',
                        'extracted_from': 'filename'
                    }
                }, status=status.HTTP_200_OK)
            except ValueError:
                pass
        
        # No pattern matched
        return Response({
            'success': True,
            'parsed': False,
            'message': 'No recognized filename pattern found',
            'filename': filename
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to parse filename: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_msg_file(request):
    """
    Process a .msg file and extract its attachments.
    Returns the extracted attachments as a list of file objects.
    """
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    msg_file = request.FILES['file']
    
    # Validate file extension
    if not msg_file.name.lower().endswith('.msg'):
        return Response(
            {'error': 'File must be a .msg file'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create a temporary file to save the uploaded .msg file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.msg') as temp_file:
            # Write the uploaded file content to temp file
            for chunk in msg_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        try:
            # Parse the .msg file using extract-msg library
            msg = extract_msg.Message(temp_file_path)
            
            # Extract attachments from the .msg file
            attachments_data = []
            
            if hasattr(msg, 'attachments') and msg.attachments:
                for i, attachment in enumerate(msg.attachments):
                    try:
                        # Get attachment data
                        attachment_data = attachment.data
                        attachment_name = attachment.longFilename or attachment.shortFilename or f'attachment_{i}'
                        
                        if attachment_data:
                            # Create file-like object for the attachment
                            attachment_info = {
                                'name': attachment_name,
                                'size': len(attachment_data),
                                'data': attachment_data.hex(),  # Convert to hex for JSON serialization
                                'mime_type': getattr(attachment, 'mimeType', 'application/octet-stream')
                            }
                            attachments_data.append(attachment_info)
                    except Exception as e:
                        print(f'Error processing attachment {i}: {str(e)}')
                        continue
            
            # Extract email metadata for reference
            email_info = {
                'subject': getattr(msg, 'subject', ''),
                'sender': getattr(msg, 'sender', ''),
                'date': str(getattr(msg, 'date', '')),
                'body': getattr(msg, 'body', '')[:500] if getattr(msg, 'body', '') else ''  # First 500 chars
            }
            
            return Response({
                'success': True,
                'attachments': attachments_data,
                'email_info': email_info,
                'message': f'Successfully extracted {len(attachments_data)} attachments from {msg_file.name}'
            }, status=status.HTTP_200_OK)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        # Clean up temporary file in case of error
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
            
        return Response(
            {'error': f'Failed to process .msg file: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
