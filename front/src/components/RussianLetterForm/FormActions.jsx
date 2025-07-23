import React from 'react';
import {
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { MESSAGES } from '../../constants/russianLetterForm';

const FormActions = ({ 
  submitting, 
  handleCancel 
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      <Button
        variant="outlined"
        color="secondary"
        onClick={handleCancel}
        startIcon={<CancelIcon />}
        disabled={submitting}
      >
        {MESSAGES.cancel}
      </Button>
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
      >
        {submitting ? MESSAGES.submitting : MESSAGES.save}
      </Button>
    </Box>
  );
};

export default FormActions;
