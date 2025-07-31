import React, { useState } from "react";
import {
  Paper,
  Typography,
  Divider,
  Grid,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { correspondenceApi } from '../../services/apiService';

const BasicInformation = ({ letter, onUpdate }) => {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);

  const canEdit = user?.canEditCorrespondence?.() || false;

  // Fetch correspondence types for Russian letters
  useEffect(() => {
    const fetchCorrespondenceTypes = async () => {
      try {
        const response = await correspondenceApi.getCorrespondenceTypes();
        // Filter for Russian types or all types - adjust based on your API
        setCorrespondenceTypes(response.data || []);
      } catch (error) {
        console.error('Error fetching correspondence types:', error);
      }
    };
    fetchCorrespondenceTypes();
  }, []);

  const handleStartEdit = (fieldName, currentValue) => {
    if (!canEdit) return;
    setEditingField(fieldName);
    setEditValue(currentValue || '');
  };

  const handleSave = async () => {
    if (!editingField || !onUpdate) return;
    
    setSaving(true);
    try {
      await onUpdate(editingField, editValue);
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Convert Gregorian date to Hijri display (you may need a proper Hijri library)
  const formatHijriDate = (gregorianDate) => {
    if (!gregorianDate) return 'غير محدد';
    // For now, just display the date - you can integrate a Hijri conversion library
    // like moment-hijri or hijri-date
    return new Date(gregorianDate).toLocaleDateString('ar-SA-u-ca-islamic');
  };

  const renderEditableField = (label, value, fieldName, inputType = 'text', options = null) => {
    const isEditing = editingField === fieldName;
    
    return (
      <Grid container alignItems="center" sx={{ minHeight: '60px', mb: 2 }}>
        <Grid item xs={4}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            {label}:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditing ? (
              <>
                {inputType === 'select' && options ? (
                  <FormControl size="small" sx={{ minWidth: 250 }}>
                    <Select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                    >
                      {options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    size="small"
                    type={inputType}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    InputLabelProps={inputType === 'date' ? { shrink: true } : {}}
                    sx={{ minWidth: 250 }}
                    placeholder={fieldName === 'reference_number' ? 'مثال: 123/45/ص' : ''}
                  />
                )}
                <IconButton 
                  size="small" 
                  onClick={handleSave}
                  disabled={saving}
                  color="primary"
                >
                  {saving ? <CircularProgress size={16} /> : <SaveIcon />}
                </IconButton>
                <IconButton size="small" onClick={handleCancel} disabled={saving}>
                  <CancelIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    cursor: canEdit ? 'pointer' : 'default',
                    '&:hover': canEdit ? { backgroundColor: 'action.hover' } : {},
                    padding: '8px 12px',
                    borderRadius: 1,
                    transition: 'background-color 0.2s',
                    minWidth: '200px'
                  }}
                  onClick={() => handleStartEdit(fieldName, fieldName === 'correspondence_date' ? letter.correspondence_date : value)}
                >
                  {fieldName === 'correspondence_date' ? formatHijriDate(letter.correspondence_date) : (value || 'غير محدد')}
                </Typography>
                {canEdit && (
                  <IconButton 
                    size="small" 
                    onClick={() => handleStartEdit(fieldName, fieldName === 'correspondence_date' ? letter.correspondence_date : value)}
                    sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            المعلومات الأساسية
          </Typography>
          {canEdit && (
            <Chip 
              label="قابل للتعديل" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          )}
        </Box>

        <Grid container spacing={0}>
          {renderEditableField('الرقم المرجعي', letter.reference_number, 'reference_number')}
          {renderEditableField('تاريخ الخطاب (هجري)', letter.correspondence_date, 'correspondence_date', 'date')}
          {renderEditableField('نوع الخطاب', letter.type?.type_name, 'type', 'select', 
            correspondenceTypes.map(type => ({
              value: type.correspondence_type_id || type.type_id,
              label: type.type_name
            }))
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInformation;
