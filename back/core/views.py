from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from django.http import FileResponse
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
    CorrespondenceTypes, Contacts, Correspondence,
    Attachments, Permits, ApprovalDecisions,
    Accidents, Relocation, RelocationPeriod, Vehicle, CarPermit,
    CardPermits, CardPhotos, Settings, CorrespondenceTypeProcedure, CorrespondenceStatusLog
)
from .serializers import (
    PeopleHistorySerializer, CompaniesHistorySerializer, EmploymentHistorySerializer,
    FamilyRelationshipsSerializer, CorrespondenceTypesSerializer, ContactsSerializer,
    CorrespondenceSerializer, AttachmentsSerializer,
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
    Uses region-based extraction with PyMuPDF for high accuracy.
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
        import fitz  # PyMuPDF
        from io import BytesIO
        from datetime import datetime
        
        # Read PDF content into memory
        pdf_content = BytesIO(pdf_file.read())
        
        # Open PDF document
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        
        if len(doc) == 0:
            doc.close()
            return Response({
                'success': True,
                'parsed': False,
                'message': 'PDF file appears to be empty'
            }, status=status.HTTP_200_OK)
        
        # Get first page
        page = doc[0]
        page_rect = page.rect
        
        # Define relative coordinates for letter data region (based on your working script)
        # These percentages work universally across different PDF sizes
        letter_x1_percent, letter_y1_percent = 0.234, 0.159  # 23.4%, 15.9%
        letter_x2_percent, letter_y2_percent = 0.376, 0.193  # 37.6%, 19.3%
        
        # Define relative coordinates for Block 8 (subject/vehicle info)
        # Block 8 coordinates: (70.9,276.3) to (496.6,291.8) on 595x842 PDF
        block8_x1_percent, block8_y1_percent = 0.119, 0.328  # 11.9%, 32.8%
        block8_x2_percent, block8_y2_percent = 0.95, 0.347  # 83.4%, 34.7%
        
        # Calculate absolute coordinates for current PDF
        letter_x1 = letter_x1_percent * page_rect.width
        letter_y1 = letter_y1_percent * page_rect.height
        letter_x2 = letter_x2_percent * page_rect.width
        letter_y2 = letter_y2_percent * page_rect.height
        
        block8_x1 = block8_x1_percent * page_rect.width
        block8_y1 = block8_y1_percent * page_rect.height
        block8_x2 = block8_x2_percent * page_rect.width
        block8_y2 = block8_y2_percent * page_rect.height
        
        # Extract text from the letter data region
        rect = fitz.Rect(letter_x1, letter_y1, letter_x2, letter_y2)
        region_text = page.get_text("text", clip=rect).strip()
        
        # Extract text from Block 8 (subject info) - enhanced for multi-line extraction
        block8_rect = fitz.Rect(block8_x1, block8_y1, block8_x2, block8_y2)
        block8_text = page.get_text("text", clip=block8_rect).strip()
        
        # Check for additional text blocks within 15 pixels below Block 8 for multi-line subjects
        additional_subject_text = ""
        search_height = 15  # pixels to search below Block 8
        
        # Define extended search area (15px below Block 8)
        extended_y1 = block8_y2  # Start from bottom of Block 8
        extended_y2 = block8_y2 + search_height  # Search 15px below
        extended_rect = fitz.Rect(block8_x1, extended_y1, block8_x2, extended_y2)
        
        # Extract text from the extended area
        extended_text = page.get_text("text", clip=extended_rect).strip()
        
        if extended_text:
            # Clean and append the extended text
            additional_subject_text = extended_text.strip().replace('\n', ' ').replace('\r', ' ')
            additional_subject_text = ' '.join(additional_subject_text.split())  # Remove extra whitespace
            
        # Combine Block 8 text with any additional text found below
        if block8_text and additional_subject_text:
            # Combine with a space separator
            full_block8_text = f"{block8_text} {additional_subject_text}"
        elif additional_subject_text:
            # Only additional text found
            full_block8_text = additional_subject_text
        else:
            # Only main Block 8 text
            full_block8_text = block8_text
            
        # Use the combined text as the final block8_text
        block8_text = full_block8_text
        
        # Split into paragraphs/lines
        paragraphs = [p.strip() for p in region_text.split('\n') if p.strip()]
        
        reference_number = None
        correspondence_date = None
        subject = None
        
        # Process extracted paragraphs
        if len(paragraphs) >= 1:
            # First paragraph typically contains the reference number
            ref_text = paragraphs[0]
            # Clean and extract reference number
            reference_number = ref_text.strip()
            
        if len(paragraphs) >= 2:
            # Second paragraph typically contains the date
            date_text = paragraphs[1]
            
            # Try to parse the date from various formats
            date_patterns = [
                r'(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{4})',  # DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
                r'(\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2})',  # YYYY/MM/DD, YYYY-MM-DD, or YYYY.MM.YYYY
                r'(\d{1,2}\s+\w+\s+\d{4})',  # DD Month YYYY
            ]
            
            # First try to parse the entire date_text as a date (common case)
            try:
                # Check if the date_text is already in a date format (like "22.07.2025")
                if re.match(r'^\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}$', date_text):
                    # Determine separator (., -, or /)
                    separator = '.' if '.' in date_text else ('/' if '/' in date_text else '-')
                    parts = date_text.split(separator)
                    
                    if len(parts) == 3:
                        # Assume DD.MM.YYYY format (common for Russian letters)
                        day, month, year = parts
                        parsed_date = datetime(int(year), int(month), int(day))
                        correspondence_date = parsed_date.strftime('%Y-%m-%d')
            except (ValueError, IndexError):
                # If direct parsing fails, try pattern matching
                for pattern in date_patterns:
                    match = re.search(pattern, date_text)
                    if match:
                        date_str = match.group(1).strip()
                        try:
                            # Handle different date formats with different separators
                            separator = None
                            for sep in ['.', '/', '-']:
                                if sep in date_str:
                                    separator = sep
                                    break
                                    
                            if separator and len(date_str.split(separator)) == 3:
                                parts = date_str.split(separator)
                                
                                # Determine date format
                                if len(parts[0]) == 4:  # YYYY/MM/DD
                                    year, month, day = parts
                                else:  # DD/MM/YYYY (most common for Russian letters)
                                    day, month, year = parts
                                
                                # Validate and format
                                parsed_date = datetime(int(year), int(month), int(day))
                                correspondence_date = parsed_date.strftime('%Y-%m-%d')
                                break
                        except (ValueError, IndexError):
                            continue
        
        # Close the document
        doc.close()
        
        # If region extraction didn't work, try fallback full-page extraction
        if not reference_number and not correspondence_date:
            # Fallback: extract from full page and use pattern matching
            doc = fitz.open(stream=BytesIO(pdf_file.read()), filetype="pdf")
            page = doc[0]
            full_text = page.get_text("text")
            lines = full_text.split('\n')
            
            # Search for reference number patterns in full text
            ref_patterns = [
                r'(?:رقم|Ref|Reference|REF|No\.?)\s*:?\s*([A-Z0-9/\-]+)',
                r'([A-Z0-9]+/[A-Z0-9/\-]+)',  # Direct pattern like "123/ABC/2025"
            ]
            
            # Search for date patterns in full text
            date_patterns = [
                r'(?:تاريخ|Date|DATE)\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})',
                r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})',
            ]
            
            # Process first 15 lines for patterns
            for line in lines[:15]:
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
                            try:
                                parts = date_str.replace('-', '/').split('/')
                                if len(parts) == 3:
                                    if len(parts[0]) == 4:
                                        year, month, day = parts
                                    else:
                                        day, month, year = parts
                                    
                                    parsed_date = datetime(int(year), int(month), int(day))
                                    correspondence_date = parsed_date.strftime('%Y-%m-%d')
                                    break
                            except (ValueError, IndexError):
                                continue
            
            doc.close()
        
        # Extract subject from Block 8 text
        if block8_text:
            # Clean up the extracted text and use it as subject
            subject = block8_text.strip().replace('\n', ' ').replace('\r', ' ')
            # Remove extra whitespace
            subject = ' '.join(subject.split())
        
        # Determine parsing success and confidence
        if reference_number or correspondence_date or subject:
            confidence = 'high' if (reference_number and correspondence_date and subject) else 'medium'
            extraction_method = 'region_based' if paragraphs else 'pattern_matching'
            
            return Response({
                'success': True,
                'parsed': True,
                'method': f'pdf_content_extraction_{extraction_method}',
                'data': {
                    'reference_number': reference_number,
                    'correspondence_date': correspondence_date,
                    'subject': subject,
                    'confidence': confidence,
                    'extracted_from': 'pdf_content',
                    'extraction_method': extraction_method
                },
                'debug_info': {
                    'region_paragraphs': paragraphs[:5] if paragraphs else [],
                    'block8_text': block8_text,
                    'block8_main_text': page.get_text("text", clip=block8_rect).strip(),
                    'block8_extended_text': additional_subject_text,
                    'pdf_dimensions': f'{page_rect.width}x{page_rect.height}',
                    'correspondence_date': correspondence_date
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': True,
                'parsed': False,
                'message': 'No reference number, date, or subject found in PDF content',
                'debug_info': {
                    'region_paragraphs': paragraphs[:5] if paragraphs else [],
                    'block8_text': block8_text,
                    'block8_main_text': page.get_text("text", clip=block8_rect).strip() if 'block8_rect' in locals() else '',
                    'block8_extended_text': additional_subject_text if 'additional_subject_text' in locals() else '',
                    'pdf_dimensions': f'{page_rect.width}x{page_rect.height}',
                    'region_coordinates': f'({letter_x1:.1f},{letter_y1:.1f}) to ({letter_x2:.1f},{letter_y2:.1f})',
                    'block8_coordinates': f'({block8_x1:.1f},{block8_y1:.1f}) to ({block8_x2:.1f},{block8_y2:.1f})',
                    'block8_extended_coordinates': f'({block8_x1:.1f},{extended_y1:.1f}) to ({block8_x2:.1f},{extended_y2:.1f})',
                    'correspondence_date': correspondence_date
                }
            }, status=status.HTTP_200_OK)
            
    except ImportError:
        return Response(
            {'error': 'PyMuPDF (fitz) library is not installed. Please install it to process PDF files.'}, 
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
