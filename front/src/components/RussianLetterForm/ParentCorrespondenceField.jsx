import React from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  Typography
} from '@mui/material';
import { FORM_LABELS, FORM_PLACEHOLDERS, MESSAGES } from '../../constants/russianLetterForm';

const ParentCorrespondenceField = ({ 
  formData, 
  handleInputChange, 
  filteredCorrespondences,
  parentSearchTerm,
  setParentSearchTerm 
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Autocomplete
        options={filteredCorrespondences}
        getOptionLabel={(option) => `${option.reference_number} - ${option.subject}`}
        value={filteredCorrespondences.find(corr => corr.correspondence_id === formData.parent_correspondence) || null}
        onChange={(event, newValue) => {
          handleInputChange('parent_correspondence', newValue ? newValue.correspondence_id : null);
        }}
        inputValue={parentSearchTerm}
        onInputChange={(event, newInputValue) => {
          setParentSearchTerm(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={FORM_LABELS.parent_correspondence}
            placeholder={FORM_PLACEHOLDERS.parent_correspondence}
            variant="outlined"
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {option.reference_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.subject}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={MESSAGES.noOptionsText}
        clearText={MESSAGES.clearText}
        openText={MESSAGES.openText}
        closeText={MESSAGES.closeText}
        isOptionEqualToValue={(option, value) => option.correspondence_id === value.correspondence_id}
      />
    </Box>
  );
};

export default ParentCorrespondenceField;
