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
import { useRussianLetterForm } from "../components/RussianLetterForm/hooks/useRussianLetterForm";
import { useDragAndDrop } from '../components/RussianLetterForm/hooks/useDragAndDrop';
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
    filteredCorrespondences,
    resetForm,
    setFormData
  } = useRussianLetterForm();

  const {
    handleFiles,
    removeAttachment
  } = useDragAndDrop(formData, setFormData, setDragActive,resetForm);

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
//
  return (
    <Box sx={{ p: 2, maxWidth: 800, margin: 'auto', position: 'relative' }}>
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <MailIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" component="h1">
          إضافة خطاب جديد
        </Typography>
      </Box>

      <Divider sx={{ mb: 1 }} />

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
            procedures={procedures}
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
