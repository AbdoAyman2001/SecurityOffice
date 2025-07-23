import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Mail as MailIcon
} from '@mui/icons-material';
import { useRussianLetterForm } from '../hooks/useRussianLetterForm';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { MESSAGES } from '../constants/russianLetterForm';
import BasicFormFields from '../components/RussianLetterForm/BasicFormFields';
import ParentCorrespondenceField from '../components/RussianLetterForm/ParentCorrespondenceField';
import AttachmentsField from '../components/RussianLetterForm/AttachmentsField';
import FormActions from '../components/RussianLetterForm/FormActions';

const RussianLetterForm = () => {
  // Use custom hooks for form logic and drag & drop
  const {
    formData,
    loading,
    submitting,
    error,
    success,
    correspondenceTypes,
    correspondences,
    procedures,
    contacts,
    hasPermission,
    dragActive,
    parentSearchTerm,
    handleInputChange,
    handleSubmit,
    handleCancel,
    setDragActive,
    setParentSearchTerm,
    filteredCorrespondences
  } = useRussianLetterForm();

  const {
    handleFiles,
    removeAttachment
  } = useDragAndDrop(formData, handleInputChange, setDragActive);

  // Check permissions
  if (!hasPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          ليس لديك صلاحية لإضافة خطابات روسية جديدة.
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{MESSAGES.loading}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Drag and Drop Overlay */}
      {dragActive && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            border: '3px dashed #1976d2',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h4" color="primary" gutterBottom>
            {MESSAGES.dragAndDrop}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {MESSAGES.dragAndDropSubtext}
          </Typography>
        </Box>
      )}

      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MailIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          إضافة خطاب روسي جديد
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Basic Form Fields */}
          <BasicFormFields
            formData={formData}
            handleInputChange={handleInputChange}
            correspondenceTypes={correspondenceTypes}
            contacts={contacts}
          />

          {/* Parent Correspondence Field */}
          <ParentCorrespondenceField
            formData={formData}
            handleInputChange={handleInputChange}
            filteredCorrespondences={filteredCorrespondences}
            parentSearchTerm={parentSearchTerm}
            setParentSearchTerm={setParentSearchTerm}
          />

          {/* Attachments Field */}
          <AttachmentsField
            formData={formData}
            handleFiles={handleFiles}
            removeAttachment={removeAttachment}
          />

          {/* Form Actions */}
          <FormActions
            submitting={submitting}
            handleCancel={handleCancel}
          />
        </form>
      </Paper>
    </Box>
  );
};

export default RussianLetterForm;
import { useRussianLetterForm } from '../hooks/useRussianLetterForm';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { MESSAGES } from '../constants/russianLetterForm';
import BasicFormFields from '../components/RussianLetterForm/BasicFormFields';
import ParentCorrespondenceField from '../components/RussianLetterForm/ParentCorrespondenceField';
import AttachmentsField from '../components/RussianLetterForm/AttachmentsField';
import FormActions from '../components/RussianLetterForm/FormActions';

const RussianLetterForm = () => {
  // Use custom hooks for form logic and drag & drop
  const {
    formData,
    loading,
    submitting,
    error,
    success,
    correspondenceTypes,
    correspondences,
    procedures,
    contacts,
    hasPermission,
    dragActive,
    parentSearchTerm,
    handleInputChange,
    handleSubmit,
    handleCancel,
    setDragActive,
    setParentSearchTerm,
    filteredCorrespondences
  } = useRussianLetterForm();

  const {
    handleFiles,
    removeAttachment
  } = useDragAndDrop(formData, handleInputChange, setDragActive);

  // Check permissions
  if (!hasPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          ليس لديك صلاحية لإضافة خطابات روسية جديدة.
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{MESSAGES.loading}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Drag and Drop Overlay */}
      {dragActive && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            border: '3px dashed #1976d2',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h4" color="primary" gutterBottom>
            {MESSAGES.dragAndDrop}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {MESSAGES.dragAndDropSubtext}
          </Typography>
        </Box>
      )}

      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MailIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          إضافة خطاب روسي جديد
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Basic Form Fields */}
          <BasicFormFields
            formData={formData}
            handleInputChange={handleInputChange}
            correspondenceTypes={correspondenceTypes}
            contacts={contacts}
          />

          {/* Parent Correspondence Field */}
          <ParentCorrespondenceField
            formData={formData}
            handleInputChange={handleInputChange}
            filteredCorrespondences={filteredCorrespondences}
            parentSearchTerm={parentSearchTerm}
            setParentSearchTerm={setParentSearchTerm}
          />

          {/* Attachments Field */}
          <AttachmentsField
            formData={formData}
            handleFiles={handleFiles}
            removeAttachment={removeAttachment}
          />

          {/* Form Actions */}
          <FormActions
            submitting={submitting}
            handleCancel={handleCancel}
          />
        </form>
      </Paper>
    </Box>
  );
};

export default RussianLetterForm;
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
      resetForm();
      
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
    resetForm();
    // navigate('/russian-letters');
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
          {/* Reference Number and Date - Same Line */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="الرقم المرجعى"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="مثال: 123/45/ص"
              variant="outlined"
              sx={{ flex: 1 }}
            />
            <TextField
              label="تاريخ الخطاب"
              type="date"
              value={formData.correspondence_date}
              onChange={(e) => handleInputChange('correspondence_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Type and Priority - Same Line */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl variant="outlined" required sx={{ flex: 1 }}>
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
            <FormControl variant="outlined" sx={{ flex: 1 }}>
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

          {/* Attachments */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachIcon sx={{ mr: 1 }} />
              المرفقات *
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              يجب إرفاق ملف واحد على الأقل - يمكنك سحب الملفات وإفلاتها في أي مكان على الصفحة
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => document.getElementById('file-input').click()}
              sx={{ mb: 2 }}
            >
              اختيار الملفات
            </Button>
            
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
