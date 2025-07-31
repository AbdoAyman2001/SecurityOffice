import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Typography,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { correspondenceApi } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const RussianLetterEditModal = ({ open, onClose, letter, onSuccess }) => {
  const { canEditCorrespondence } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    reference_number: '',
    correspondence_date: '',
    subject: '',
    summary: '',
    priority: 'normal',
    direction: 'Incoming',
    contact_id: '',
    type_id: '',
    current_status_id: '',
    assigned_to_id: ''
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Options data
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [users, setUsers] = useState([]);

  // Initialize form data when letter changes
  useEffect(() => {
    if (letter && open) {
      setFormData({
        reference_number: letter.reference_number || '',
        correspondence_date: letter.correspondence_date || '',
        subject: letter.subject || '',
        summary: letter.summary || '',
        priority: letter.priority || 'normal',
        direction: letter.direction || 'Incoming',
        contact_id: letter.contact?.contact_id || '',
        type_id: letter.type?.correspondence_type_id || '',
        current_status_id: letter.current_status?.id || '',
        assigned_to_id: letter.assigned_to?.id || ''
      });
      loadFormOptions();
    }
  }, [letter, open]);

  // Load form options
  const loadFormOptions = async () => {
    try {
      setLoading(true);
      const [typesResponse, contactsResponse, usersResponse] = await Promise.all([
        correspondenceApi.getCorrespondenceTypes({ category: 'Russian' }),
        correspondenceApi.getContacts(),
        correspondenceApi.getUsers()
      ]);

      setCorrespondenceTypes(typesResponse.data || []);
      setContacts(contactsResponse.data || []);
      setUsers(usersResponse.data || []);

      // Load procedures for current type
      if (formData.type_id) {
        const proceduresResponse = await correspondenceApi.getTypeProcedures(formData.type_id);
        setProcedures(proceduresResponse.data || []);
      }
    } catch (err) {
      console.error('Error loading form options:', err);
      setError('حدث خطأ أثناء تحميل بيانات النموذج.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Load procedures when type changes
    if (field === 'type_id' && value) {
      loadProceduresForType(value);
    }
  };

  // Load procedures for selected type
  const loadProceduresForType = async (typeId) => {
    try {
      const proceduresResponse = await correspondenceApi.getTypeProcedures(typeId);
      const proceduresData = proceduresResponse.data || [];
      setProcedures(proceduresData);
      
      // Reset current status if it doesn't belong to new type
      const currentStatusExists = proceduresData.some(p => p.id === formData.current_status_id);
      if (!currentStatusExists) {
        setFormData(prev => ({ ...prev, current_status_id: '' }));
      }
    } catch (err) {
      console.error('Error loading procedures:', err);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEditCorrespondence()) {
      setError('ليس لديك الصلاحية لتعديل الخطابات.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare data for submission
      const submitData = {
        ...formData,
        contact_id: formData.contact_id || null,
        type_id: formData.type_id || null,
        current_status_id: formData.current_status_id || null,
        assigned_to_id: formData.assigned_to_id || null
      };

      const updatedResponse = await correspondenceApi.update(letter.correspondence_id, submitData);
      
      setSuccess('تم تحديث الخطاب بنجاح.');
      setTimeout(() => {
        onSuccess(updatedResponse.data);
      }, 1000);
      
    } catch (err) {
      console.error('Error updating letter:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء تحديث الخطاب.');
    } finally {
      setSaving(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!saving) {
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  // Priority options
  const priorityOptions = [
    { value: 'high', label: 'عالية', color: 'error' },
    { value: 'normal', label: 'عادية', color: 'primary' },
    { value: 'low', label: 'منخفضة', color: 'success' }
  ];

  // Direction options
  const directionOptions = [
    { value: 'Incoming', label: 'وارد' },
    { value: 'Outgoing', label: 'صادر' },
    { value: 'Internal', label: 'داخلي' }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            تعديل الخطاب #{letter?.correspondence_id}
          </Typography>
          {letter?.subject && (
            <Chip 
              label={letter.subject} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          )}
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>جاري تحميل بيانات النموذج...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {!loading && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  المعلومات الأساسية
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="رقم المرجع"
                  value={formData.reference_number}
                  onChange={(e) => handleInputChange('reference_number', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="تاريخ الخطاب"
                  type="date"
                  value={formData.correspondence_date}
                  onChange={(e) => handleInputChange('correspondence_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الموضوع"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الملخص"
                  multiline
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                />
              </Grid>

              {/* Classification */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  التصنيف والحالة
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>الأولوية</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    label="الأولوية"
                  >
                    {priorityOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            size="small" 
                            label={option.label} 
                            color={option.color}
                            sx={{ mr: 1 }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>الاتجاه</InputLabel>
                  <Select
                    value={formData.direction}
                    onChange={(e) => handleInputChange('direction', e.target.value)}
                    label="الاتجاه"
                  >
                    {directionOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>نوع الخطاب</InputLabel>
                  <Select
                    value={formData.type_id}
                    onChange={(e) => handleInputChange('type_id', e.target.value)}
                    label="نوع الخطاب"
                  >
                    <MenuItem value="">
                      <em>اختر نوع الخطاب</em>
                    </MenuItem>
                    {correspondenceTypes.map(type => (
                      <MenuItem key={type.correspondence_type_id} value={type.correspondence_type_id}>
                        {type.type_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!formData.type_id}>
                  <InputLabel>الحالة الحالية</InputLabel>
                  <Select
                    value={formData.current_status_id}
                    onChange={(e) => handleInputChange('current_status_id', e.target.value)}
                    label="الحالة الحالية"
                  >
                    <MenuItem value="">
                      <em>اختر الحالة</em>
                    </MenuItem>
                    {procedures.map(procedure => (
                      <MenuItem key={procedure.id} value={procedure.id}>
                        {procedure.procedure_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Contacts and Assignment */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  جهات الاتصال والتكليف
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={contacts}
                  getOptionLabel={(option) => `${option.name} (${option.contact_type === 'Person' ? 'شخص' : 'منظمة'})`}
                  value={contacts.find(c => c.contact_id === formData.contact_id) || null}
                  onChange={(event, newValue) => {
                    handleInputChange('contact_id', newValue?.contact_id || '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="جهة الاتصال"
                      placeholder="ابحث عن جهة اتصال..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.contact_type === 'Person' ? 'شخص' : 'منظمة'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(option) => option.full_name_arabic || option.username}
                  value={users.find(u => u.id === formData.assigned_to_id) || null}
                  onChange={(event, newValue) => {
                    handleInputChange('assigned_to_id', newValue?.id || '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="المسؤول"
                      placeholder="ابحث عن مستخدم..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2">
                          {option.full_name_arabic || option.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.department || 'بدون قسم'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClose}
            disabled={saving}
            startIcon={<CancelIcon />}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RussianLetterEditModal;
