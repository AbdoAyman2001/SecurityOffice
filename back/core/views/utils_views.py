"""
Utility functions for the SecurityOffice application.

This module contains utility API functions for file processing and data extraction:
- parse_pdf_content: Extracts Russian letter data from PDF files using PyMuPDF
- parse_filename: Fallback method to extract data from filenames
- process_msg_file: Processes .msg files and extracts attachments
- download_attachment: Handles file attachment downloads
"""

import os
import tempfile
import json
import extract_msg
import email
from email import policy
import mimetypes
import re
from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.base import ContentFile

from ..models import Attachments


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
        import tempfile
        import os
        
        # Create a temporary copy of the PDF file to avoid file lock issues
        # This prevents PermissionError when the original file is locked by Outlook or other applications
        temp_pdf_path = None
        
        # Read the uploaded PDF file content into memory
        pdf_content = pdf_file.read()
        
        # Create a temporary file with .pdf extension
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            temp_pdf_path = temp_file.name
            temp_file.write(pdf_content)
        
        # Open PDF document from the temporary file
        doc = fitz.open(temp_pdf_path)
        
        if len(doc) == 0:
            doc.close()
            return Response({
                'success': True,
                'parsed': False,
                'message': 'PDF file appears to be empty'
            }, status=status.HTTP_200_OK)
        
        # Get first page with validation
        try:
            page = doc[0]
            if page is None:
                doc.close()
                return Response({
                    'success': True,
                    'parsed': False,
                    'message': 'PDF first page is invalid or corrupted'
                }, status=status.HTTP_200_OK)
        except (IndexError, Exception) as e:
            doc.close()
            return Response({
                'success': True,
                'parsed': False,
                'message': f'Unable to access PDF first page: {str(e)}'
            }, status=status.HTTP_200_OK)
        
        # Validate page rect
        try:
            page_rect = page.rect
            if page_rect is None or page_rect.width <= 0 or page_rect.height <= 0:
                doc.close()
                return Response({
                    'success': True,
                    'parsed': False,
                    'message': 'PDF page has invalid dimensions'
                }, status=status.HTTP_200_OK)
        except Exception as e:
            doc.close()
            return Response({
                'success': True,
                'parsed': False,
                'message': f'Unable to get PDF page dimensions: {str(e)}'
            }, status=status.HTTP_200_OK)
        
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
        
        # Extract text from the letter data region with additional page validation
        try:
            if page is None:
                doc.close()
                return Response({
                    'success': True,
                    'parsed': False,
                    'message': 'PDF page became invalid during processing'
                }, status=status.HTTP_200_OK)
            
            rect = fitz.Rect(letter_x1, letter_y1, letter_x2, letter_y2)
            region_text = page.get_text("text", clip=rect).strip()
            
            # Extract text from Block 8 (subject info) - enhanced for multi-line extraction
            block8_rect = fitz.Rect(block8_x1, block8_y1, block8_x2, block8_y2)
            block8_text = page.get_text("text", clip=block8_rect).strip()
            
            # Check for additional text blocks within 15 pixels below Block 8 for multi-line subjects
            additional_subject_text = ""
            extended_y1 = block8_y2
            extended_y2 = block8_y2 + 15
            if extended_y2 <= page_rect.height:
                extended_rect = fitz.Rect(block8_x1, extended_y1, block8_x2, extended_y2)
                additional_subject_text = page.get_text("text", clip=extended_rect).strip()
            
            # Combine Block 8 text with additional text if found
            full_subject_text = block8_text
            if additional_subject_text and additional_subject_text not in block8_text:
                full_subject_text = f"{block8_text} {additional_subject_text}".strip()
            
        except Exception as e:
            doc.close()
            return Response({
                'success': True,
                'parsed': False,
                'message': f'Failed to extract text from PDF: {str(e)}'
            }, status=status.HTTP_200_OK)
        
        # Close the document
        doc.close()
        
        # Parse the extracted text for reference number and date
        paragraphs = [p.strip() for p in region_text.split('\n') if p.strip()]
        
        reference_number = None
        correspondence_date = None
        
        # Extract reference number and date from paragraphs
        for paragraph in paragraphs:
            # Look for reference number pattern (digits)
            if reference_number is None:
                ref_match = re.search(r'\b(\d{3,6})\b', paragraph)
                if ref_match:
                    reference_number = ref_match.group(1)
            
            # Look for date pattern (DD/MM/YYYY or DD.MM.YYYY)
            if correspondence_date is None:
                date_match = re.search(r'\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b', paragraph)
                if date_match:
                    day, month, year = date_match.groups()
                    try:
                        # Validate and format date
                        datetime.strptime(f'{year}-{month.zfill(2)}-{day.zfill(2)}', '%Y-%m-%d')
                        correspondence_date = f'{year}-{month.zfill(2)}-{day.zfill(2)}'
                    except ValueError:
                        continue
        
        # Return results
        if reference_number or correspondence_date or full_subject_text:
            return Response({
                'success': True,
                'parsed': True,
                'method': 'pdf_region_extraction',
                'data': {
                    'reference_number': reference_number,
                    'correspondence_date': correspondence_date,
                    'subject': full_subject_text,
                    'confidence': 'high',
                    'extracted_from': 'pdf_content'
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
                    'block8_main_text': block8_text,
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
    finally:
        # Clean up the temporary PDF file
        if 'temp_pdf_path' in locals() and temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.unlink(temp_pdf_path)
            except PermissionError:
                # If we can't delete the temp file immediately (e.g., still in use),
                # the OS will clean it up later. This is not a critical error.
                pass
            except Exception:
                # Ignore other cleanup errors - temp files will be cleaned up by OS
                pass


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
    
    temp_file_path = None
    try:
        # Create a temporary file to save a copy of the .msg file
        # This approach works even if the original file is locked by Outlook
        with tempfile.NamedTemporaryFile(delete=False, suffix='.msg') as temp_file:
            # Read the entire file content into memory first
            msg_file.seek(0)  # Ensure we're at the beginning
            file_content = msg_file.read()
            
            # Write the content to our temporary file
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
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
            
    except Exception as e:
        return Response(
            {'error': f'Failed to process .msg file: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        # Clean up temporary file - use try/except to handle permission errors gracefully
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except PermissionError:
                # If we can't delete the temp file immediately, it will be cleaned up by the OS eventually
                # This can happen on Windows when the file is still being accessed
                print(f'Warning: Could not delete temporary file {temp_file_path}. It will be cleaned up by the OS.')
            except Exception as e:
                print(f'Warning: Error deleting temporary file {temp_file_path}: {str(e)}')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_attachment(request, attachment_id):
    """
    Download an attachment file by its ID.
    """
    try:
        attachment = Attachments.objects.get(attachment_id=attachment_id)
        
        if not attachment.file_path or not os.path.exists(attachment.file_path):
            return Response(
                {'error': 'Attachment file not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Determine content type
        content_type = attachment.mime_type or mimetypes.guess_type(attachment.file_name)[0] or 'application/octet-stream'
        
        # Return file response
        response = FileResponse(
            open(attachment.file_path, 'rb'),
            content_type=content_type,
            as_attachment=True,
            filename=attachment.file_name
        )
        
        return response
        
    except Attachments.DoesNotExist:
        return Response(
            {'error': 'Attachment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to download attachment: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
