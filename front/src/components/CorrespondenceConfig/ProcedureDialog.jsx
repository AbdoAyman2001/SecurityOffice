import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';

/**
 * Dialog component for adding/editing correspondence procedures
 */
const ProcedureDialog = ({
  open,
  onClose,
  editingProcedure,
  procedureForm,
  setProcedureForm,
  onSave,
  loading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingProcedure ? 'تعديل الإجراء' : 'إضافة إجراء جديد'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="اسم الإجراء"
          fullWidth
          variant="outlined"
          value={procedureForm.procedure_name}
          onChange={(e) =>
            setProcedureForm({
              ...procedureForm,
              procedure_name: e.target.value,
            })
          }
          sx={{ mb: 2 }}
          required
        />
        <TextField
          margin="dense"
          label="الوصف"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={procedureForm.description}
          onChange={(e) =>
            setProcedureForm({
              ...procedureForm,
              description: e.target.value,
            })
          }
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="الترتيب"
          type="number"
          fullWidth
          variant="outlined"
          value={procedureForm.procedure_order}
          onChange={(e) =>
            setProcedureForm({
              ...procedureForm,
              procedure_order: parseInt(e.target.value) || 1,
            })
          }
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={procedureForm.is_initial}
              onChange={(e) =>
                setProcedureForm({
                  ...procedureForm,
                  is_initial: e.target.checked,
                })
              }
            />
          }
          label="إجراء ابتدائي (يتم تعيينه تلقائياً للخطابات الجديدة)"
          sx={{ mb: 1 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={procedureForm.is_final}
              onChange={(e) =>
                setProcedureForm({
                  ...procedureForm,
                  is_final: e.target.checked,
                })
              }
            />
          }
          label="إجراء نهائي (يعتبر الخطاب مكتملة)"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading || !procedureForm.procedure_name}
        >
          {editingProcedure ? 'تحديث' : 'إضافة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProcedureDialog;
