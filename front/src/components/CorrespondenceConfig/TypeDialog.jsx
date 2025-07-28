import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';

/**
 * Dialog component for adding/editing correspondence types
 */
const TypeDialog = ({
  open,
  onClose,
  editingType,
  typeForm,
  setTypeForm,
  onSave,
  loading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingType ? 'تعديل نوع الخطاب' : 'إضافة نوع خطاب جديد'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            autoFocus
            label="اسم نوع الخطاب"
            fullWidth
            variant="outlined"
            value={typeForm.type_name}
            onChange={(e) =>
              setTypeForm({
                ...typeForm,
                type_name: e.target.value,
              })
            }
            required
            helperText="اسم نوع الخطاب (مطلوب)"
          />
          
          <FormControl fullWidth variant="outlined" required>
            <InputLabel>فئة الخطاب</InputLabel>
            <Select
              value={typeForm.category || ''}
              onChange={(e) =>
                setTypeForm({
                  ...typeForm,
                  category: e.target.value,
                })
              }
              label="فئة الخطاب"
            >
              <MenuItem value="General">عامة (General)</MenuItem>
              <MenuItem value="Russian">روسية (Russian)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading || !typeForm.type_name || !typeForm.category}
        >
          {editingType ? 'تحديث' : 'إضافة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TypeDialog;
