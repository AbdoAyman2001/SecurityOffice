import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Autocomplete,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Mail as MailIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AttachFile as AttachIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  correspondenceApi,
  correspondenceTypesApi,
  correspondenceTypeProceduresApi,
  contactsApi,
  attachmentsApi
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const RussianLetterForm = () => {
  const navigate = useNavigate();
  const { user, canCreateCorrespondence } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    reference_number: '',
    correspondence_date: new Date().toISOString().split('T')[0],
    parent_correspondence: null,
    type: '',
    subject: '',
    direction: 'Incoming', // Always Incoming for Russian letters
    priority: 'normal',
    summary: '',
    current_status: '',
    assigned_to: null, // Always null initially
    contact: '', // Will be set to ASE contact ID
    attachments: [] // Required field for .msg files
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data state
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [correspondences, setCorrespondences] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [hasPermission, setHasPermission] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState('');

  // Priority options
  const priorityOptions = [
    { value: 'high', label: 'عالية' },
    { value: 'normal', label: 'عادية' },
    { value: 'low', label: 'منخفضة' }
  ];

  // Fetch required data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [typesResponse, correspondencesResponse, proceduresResponse, contactsResponse] = await Promise.all([
        correspondenceTypesApi.getAll(),
        correspondenceApi.getAll(),
        correspondenceTypeProceduresApi.getAll(),
        contactsApi.getAll()
      ]);

      setCorrespondenceTypes(typesResponse.data.results || typesResponse.data || []);
      setCorrespondences(correspondencesResponse.data.results || correspondencesResponse.data || []);
      setProcedures(proceduresResponse.data.results || proceduresResponse.data || []);
      const contactsData = contactsResponse.data.results || contactsResponse.data || [];
      setContacts(contactsData);
      
      // Find ASE contact and set as default
      const aseContact = contactsData.find(contact => 
        contact.name?.toLowerCase().includes('ase') || 
        contact.company_name?.toLowerCase().includes('ase')
      );
      if (aseContact) {
        setFormData(prev => ({ ...prev, contact: aseContact.id || aseContact.contact_id }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل في تحميل البيانات المطلوبة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-select initial status when correspondence type is selected
      if (field === 'type' && value) {
        const initialProcedure = procedures.find(proc => 
          proc.correspondence_type === value && proc.is_initial === true
        );
        if (initialProcedure) {
          newData.current_status = initialProcedure.id;
        }
      }
      
      return newData;
    });
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle file drag and drop (global)
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      // Only set drag inactive if we're leaving the entire page area
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    // Accept all file types now
    if (files.length === 0) {
      setError('لم يتم اختيار أي ملفات');
      return;
    }

    const regularFiles = [];
    const msgFiles = [];
    
    // Separate .msg files from regular files
    files.forEach(file => {
      if (file.name.toLowerCase().endsWith('.msg')) {
        msgFiles.push(file);
      } else {
        regularFiles.push(file);
      }
    });
    
    // Add regular files directly to attachments
    if (regularFiles.length > 0) {
      setFormData(prev => {
        const newAttachments = [...prev.attachments, ...regularFiles];
        return {
          ...prev,
          attachments: newAttachments
        };
      });
      
      // Analyze regular files for PDF patterns
      analyzeAttachmentsAndAutoFill(regularFiles);
    }
    
    // Process .msg files by sending them to backend
    if (msgFiles.length > 0) {
      await processMsgFiles(msgFiles);
    }
    
    if (error) setError(null);
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Parse PDF filename to extract letter information
  const parsePdfFilename = (filename) => {
    // Remove .pdf extension
    const nameWithoutExt = filename.replace(/\.pdf$/i, '');
    
    // Pattern: [number] [space] [dd] [space] [8-digit-date]_[subject]
    // Example: "7612 dd 22072025_On the Site Access for Contractor's Vehicle (Chevrolet ,2500, 1998, Green)"
    const pattern = /^(\d+)\s+dd\s+(\d{8})_(.*)$/i;
    const match = nameWithoutExt.match(pattern);
    
    if (match) {
      const [, letterNumber, dateString, subjectPart] = match;
      
      // Parse the 8-digit date (DDMMYYYY)
      const day = dateString.substring(0, 2);
      const month = dateString.substring(2, 4);
      const year = dateString.substring(4, 8);
      const formattedDate = `${year}-${month}-${day}`;
      
      // Clean up subject
      const subject = subjectPart.trim();
      
      return {
        letterNumber,
        date: formattedDate,
        subject: subject || ''
      };
    }
    
    return null;
  };

  // Analyze attachments and auto-fill form if PDF with correct pattern is found
  const analyzeAttachmentsAndAutoFill = (attachments) => {
    // Look for PDF files that match our pattern
    for (const file of attachments) {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const parsedInfo = parsePdfFilename(file.name);
        if (parsedInfo) {
          // Auto-fill the form with extracted information
          setFormData(prev => ({
            ...prev,
            reference_number: parsedInfo.letterNumber,
            correspondence_date: parsedInfo.date,
            subject: parsedInfo.subject
          }));
          
          // Show detailed success message to user
          const details = [];
          if (parsedInfo.letterNumber) details.push(`رقم الخطاب: ${parsedInfo.letterNumber}`);
          if (parsedInfo.date) details.push(`التاريخ: ${parsedInfo.date}`);
          if (parsedInfo.subject) details.push(`الموضوع: ${parsedInfo.subject}`);
          
          setSuccess(`✨ تم استخراج معلومات الخطاب تلقائياً:\n${details.join(' • ')}\nمن ملف: ${file.name}`);
          setTimeout(() => setSuccess(null), 7000);
          
          // Only use the first matching PDF file
          break;
        }
      }
    }
  };

  // Process .msg files by sending them to backend for attachment extraction
  const processMsgFiles = async (msgFiles) => {
    setLoading(true);
    
    // Get the API base URL (same as used in authService)
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    
    try {
      for (const msgFile of msgFiles) {
        const formData = new FormData();
        formData.append('file', msgFile);
        
        // Get the auth token (same format as used in authService)
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/api/process-msg/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${authToken}`,  // Use Token format, not Bearer
          },
          body: formData
        });
        
        if (!response.ok) {
          // Handle different response types gracefully
          let errorMessage = 'Failed to process .msg file';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If response is not JSON, use status text
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.success && result.attachments && result.attachments.length > 0) {
          // Convert hex data back to File objects
          const extractedFiles = result.attachments.map(attachment => {
            // Convert hex string back to binary data
            const binaryData = new Uint8Array(
              attachment.data.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            );
            
            // Create a new File object from the binary data
            const file = new File([binaryData], attachment.name, {
              type: attachment.mime_type || 'application/octet-stream'
            });
            
            // Add size property for display
            Object.defineProperty(file, 'size', {
              value: attachment.size,
              writable: false
            });
            
            return file;
          });
          
          // Add extracted files to attachments
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...extractedFiles]
          }));
          
          // Analyze extracted files for PDF patterns
          analyzeAttachmentsAndAutoFill(extractedFiles);
          
          // Show success message
          setSuccess(`تم استخراج ${result.attachments.length} مرفق من ملف ${msgFile.name}`);
          
          // Clear success message after 5 seconds
          setTimeout(() => setSuccess(null), 5000);
        } else {
          // If no attachments found, show info message
          setSuccess(`لم يتم العثور على مرفقات في ملف ${msgFile.name}`);
          setTimeout(() => setSuccess(null), 3000);
        }
      }
    } catch (error) {
      console.error('Error processing .msg files:', error);
      setError(`فشل في معالجة ملف .msg: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter correspondences based on search term
  const filteredCorrespondences = correspondences.filter(correspondence => {
    if (!parentSearchTerm) return true;
    const searchLower = parentSearchTerm.toLowerCase();
    return (
      correspondence.reference_number?.toLowerCase().includes(searchLower) ||
      correspondence.subject?.toLowerCase().includes(searchLower) ||
      correspondence.correspondence_id?.toString().includes(searchLower)
    );
  });

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.subject.trim()) {
      errors.push('الموضوع مطلوب');
    }

    if (!formData.type) {
      errors.push('نوع الخطاب مطلوب');
    }

    if (!formData.current_status) {
      errors.push('الحالة مطلوبة');
    }

    if (!formData.contact) {
      errors.push('جهة الاتصال مطلوبة');
    }

    if (!formData.attachments || formData.attachments.length === 0) {
      errors.push('يجب إرفاق ملف واحد على الأقل');
    }

    if (errors.length > 0) {
      setError(errors.join('، '));
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        direction: 'Incoming', // Ensure direction is always Incoming
        assigned_to: null // Ensure assigned_to is always null
      };

      // Create the correspondence first
      const response = await correspondenceApi.create(submissionData);
      const correspondenceId = response.data.correspondence?.correspondence_id || response.data.correspondence_id;
      
      // Upload attachments if any
      if (formData.attachments.length > 0) {
        try {
          await attachmentsApi.upload(correspondenceId, formData.attachments);
        } catch (attachmentError) {
          console.error('Error uploading attachments:', attachmentError);
          // Don't fail the entire operation if attachments fail
        }
      }
      
      setSuccess('تم حفظ الخطاب الروسي بنجاح!');
      
      // Reset form after successful submission
      // resetForm();
      
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'فشل في حفظ الخطاب. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      reference_number: '',
      correspondence_date: new Date().toISOString().split('T')[0],
      parent_correspondence: null,
      type: '',
      subject: '',
      direction: 'Incoming',
      priority: 'normal',
      summary: '',
      current_status: '',
      assigned_to: null,
      contact: '', // Will be reset to ASE contact
      attachments: []
    });
    
    // Reset UI state
    setError(null);
    setSuccess(null);
    setDragActive(false);
    setParentSearchTerm('');
    
    // Re-find and set ASE contact as default
    const aseContact = contacts.find(contact => 
      contact.name?.toLowerCase().includes('ase') || 
      contact.company_name?.toLowerCase().includes('ase')
    );
    if (aseContact) {
      setFormData(prev => ({ ...prev, contact: aseContact.id || aseContact.contact_id }));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/russian-letters');
  };

  // Add global drag and drop event listeners
  useEffect(() => {
    const handleGlobalDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(true);
    };

    const handleGlobalDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Only deactivate if leaving the entire document
      if (e.clientX === 0 && e.clientY === 0) {
        setDragActive(false);
      }
    };

    const handleGlobalDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    };

    // Add event listeners to document
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Check permissions on mount
  useEffect(() => {
    if (!canCreateCorrespondence()) {
      setHasPermission(false);
      setError('ليس لديك الصلاحية لإنشاء مكاتبات.');
      return;
    }
    
    fetchData();
  }, [canCreateCorrespondence]);

  // Show permission error
  if (!hasPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>جاري تحميل البيانات...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 800, margin: 'auto', position: 'relative' }}>
      {/* Global Drag Overlay */}
      {dragActive && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            backdropFilter: 'blur(2px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: 3,
              boxShadow: 3
            }}
          >
            <UploadIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              أفلت الملفات هنا
            </Typography>
            <Typography variant="body1">
              سيتم إضافة جميع الملفات إلى المرفقات
            </Typography>
          </Paper>
        </Box>
      )}
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {/* Header */}
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: 'primary.main',
            mb: 2
          }}
        >
          <MailIcon sx={{ mr: 2 }} />
          نموذج إضافة خطاب
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Reference Number */}
          <Box sx={{ mb: 3 }}>
            <TextField
              label="الرقم المرجعى"
              fullWidth
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="مثال: 123/45/ص"
              variant="outlined"
            />
          </Box>

          {/* Date */}
          <Box sx={{ mb: 3 }}>
            <TextField
              label="تاريخ الخطاب"
              type="date"
              fullWidth
              value={formData.correspondence_date}
              onChange={(e) => handleInputChange('correspondence_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Box>

          {/* Contact Field */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth variant="outlined" required>
              <InputLabel>الجهة المخاطبة</InputLabel>
              <Select
                value={formData.contact || ''}
                label="الجهة المخاطبة"
                onChange={(e) => handleInputChange('contact', e.target.value)}
                required
              >
                {contacts.map((contact) => (
                  <MenuItem key={contact.id || contact.contact_id} value={contact.id || contact.contact_id}>
                    {contact.name || contact.company_name || contact.email || 'غير محدد'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Previous Letter (Optional) - Combobox */}
          <Box sx={{ mb: 3 }}>
            <Autocomplete
              options={filteredCorrespondences}
              getOptionLabel={(option) => {
                if (!option) return '';
                const refNum = option.reference_number ? `[${option.reference_number}]` : `[رقم ${option.correspondence_id}]`;
                const subject = option.subject || 'بدون موضوع';
                return `${refNum} ${subject}`;
              }}
              value={correspondences.find(c => c.correspondence_id === formData.parent_correspondence) || null}
              onChange={(event, newValue) => {
                handleInputChange('parent_correspondence', newValue?.correspondence_id || null);
              }}
              inputValue={parentSearchTerm}
              onInputChange={(event, newInputValue) => {
                setParentSearchTerm(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="خطاب سابق (اختياري)"
                  placeholder="ابحث بالرقم المرجعى أو الموضوع..."
                  variant="outlined"
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.reference_number || `رقم ${option.correspondence_id}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.subject || 'بدون موضوع'}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              noOptionsText="لا توجد خطابات مطابقة"
              clearText="مسح"
              openText="فتح"
              closeText="إغلاق"
            />
          </Box>
          {/* Type */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth variant="outlined" required>
              <InputLabel>نوع الخطاب *</InputLabel>
              <Select
                value={formData.type || ''}
                label="نوع الخطاب *"
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
              >
                {correspondenceTypes.map((type) => (
                  <MenuItem key={type.correspondence_type_id} value={type.correspondence_type_id}>
                    {type.type_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Subject */}
          <Box sx={{ mb: 3 }}>
            <TextField
              label="الموضوع *"
              fullWidth
              required
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="موضوع الخطاب الروسي"
              variant="outlined"
            />
          </Box>

          {/* Priority */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>الأولوية</InputLabel>
              <Select
                value={formData.priority || 'normal'}
                label="الأولوية"
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Summary */}
          <Box sx={{ mb: 3 }}>
            <TextField
              label="ملخص الخطاب (اختياري)"
              multiline
              rows={4}
              fullWidth
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              placeholder="ملخص قصير لمحتوى الخطاب الروسي"
              variant="outlined"
            />
          </Box>

          {/* Attachments - Drag and Drop */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachIcon sx={{ mr: 1 }} />
              المرفقات *
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              يجب إرفاق ملف واحد على الأقل
            </Typography>
            <Paper
              sx={{
                border: `2px dashed ${dragActive ? 'primary.main' : 'grey.300'}`,
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                backgroundColor: dragActive ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                اسحب وأفلت الملفات هنا
              </Typography>
              <Typography variant="body2" color="text.secondary">
                أو انقر لاختيار الملفات
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                يُقبل جميع أنواع الملفات
              </Typography>
            </Paper>
            
            {/* Hidden File Input */}
            <input
              id="file-input"
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(Array.from(e.target.files))}
            />
            
            {/* Attached Files List */}
            {formData.attachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  الملفات المرفقة:
                </Typography>
                <List dense>
                  {formData.attachments.map((file, index) => (
                    <ListItem key={index} divider>
                      <AttachIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <ListItemText
                        primary={file.name}
                        secondary={`الحجم: ${(file.size / 1024 / 1024).toFixed(2)} ميجابايت`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => removeAttachment(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          {/* Status - Hidden: Automatically selected based on correspondence type */}
          {/* The initial status is automatically set when the user selects a correspondence type */}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              disabled={submitting}
            >
              إلغاء
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ الخطاب الروسي'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default RussianLetterForm;
