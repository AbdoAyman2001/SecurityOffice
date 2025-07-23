import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { PRIORITY_OPTIONS, FORM_LABELS, FORM_PLACEHOLDERS } from '../../constants/russianLetterForm';

const BasicFormFields = ({ 
  formData, 
  handleInputChange, 
  correspondenceTypes,
  contacts 
}) => {
  return (
    <>
      {/* Reference Number and Date - Same Line */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label={FORM_LABELS.reference_number}
          required
          fullWidth
          value={formData.reference_number}
          onChange={(e) => handleInputChange('reference_number', e.target.value)}
          placeholder={FORM_PLACEHOLDERS.reference_number}
          variant="outlined"
          sx={{ flex: 1 }}
        />
        
        <TextField
          label={FORM_LABELS.correspondence_date}
          type="date"
          required
          fullWidth
          value={formData.correspondence_date}
          onChange={(e) => handleInputChange('correspondence_date', e.target.value)}
          variant="outlined"
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Type and Priority - Same Line */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl fullWidth required sx={{ flex: 1 }}>
          <InputLabel>{FORM_LABELS.type}</InputLabel>
          <Select
            value={formData.type || ''}
            onChange={(e) => {
              console.log('Type select onChange triggered:', e.target.value);
              console.log('Current formData.type:', formData.type);
              handleInputChange('type', e.target.value);
            }}
            label={FORM_LABELS.type}
          >
            {correspondenceTypes.map((type) => {
              console.log('Rendering type option:', type);
              return (
                <MenuItem key={type.type_id} value={type.correspondence_type_id}>
                  {type.type_name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel>{FORM_LABELS.priority}</InputLabel>
          <Select
            value={formData.priority || 'normal'}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            label={FORM_LABELS.priority}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Contact */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth required>
          <InputLabel>{FORM_LABELS.contact}</InputLabel>
          <Select
            value={formData.contact || ''}
            onChange={(e) => handleInputChange('contact', e.target.value)}
            label={FORM_LABELS.contact}
          >
            {contacts.map((contact) => (
              <MenuItem key={contact.id || contact.contact_id} value={contact.id || contact.contact_id}>
                {contact.name || contact.company_name || contact.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Subject */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label={FORM_LABELS.subject}
          required
          fullWidth
          value={formData.subject}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          placeholder={FORM_PLACEHOLDERS.subject}
          variant="outlined"
        />
      </Box>

      {/* Summary */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label={FORM_LABELS.summary}
          multiline
          rows={4}
          fullWidth
          value={formData.summary}
          onChange={(e) => handleInputChange('summary', e.target.value)}
          placeholder={FORM_PLACEHOLDERS.summary}
          variant="outlined"
        />
      </Box>
    </>
  );
};

export default BasicFormFields;
