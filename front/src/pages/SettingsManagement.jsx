import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { settingsApi } from '../services/apiService';

const CustomToolbar = ({ onAdd }) => {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mr: 1 }}
      >
        إضافة إعداد جديد
      </Button>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

const SettingsManagement = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view');

  const getTypeColor = (type) => {
    switch (type) {
      case 'text': return 'default';
      case 'number': return 'primary';
      case 'boolean': return 'success';
      case 'json': return 'warning';
      case 'file': return 'info';
      default: return 'default';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'text': return 'نص';
      case 'number': return 'رقم';
      case 'boolean': return 'منطقي';
      case 'json': return 'JSON';
      case 'file': return 'ملف';
      default: return type;
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'المعرف',
      width: 80,
    },
    {
      field: 'key',
      headerName: 'المفتاح',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'value',
      headerName: 'القيمة',
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value?.length > 50 ? `${params.value.substring(0, 50)}...` : params.value}
        </Typography>
      ),
    },
    {
      field: 'setting_type',
      headerName: 'النوع',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getTypeText(params.value)}
          color={getTypeColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'category',
      headerName: 'الفئة',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'نشط',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'نشط' : 'غير نشط'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'updated_at',
      headerName: 'آخر تحديث',
      width: 150,
      valueFormatter: (params) => {
        if (params?.value) {
          return new Date(params.value).toLocaleDateString('ar-EG');
        }
        return '';
      },
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => handleView(params.row)}
          >
            عرض
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(params.row)}
          >
            تعديل
          </Button>
        </Box>
      ),
    },
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAll();
      setSettings(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError('فشل في تحميل الإعدادات');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchSettings();
      return;
    }

    try {
      setLoading(true);
      const response = await settingsApi.getAll();
      const filtered = (response.data.results || response.data).filter(setting =>
        setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSettings(filtered);
    } catch (err) {
      setError('فشل في البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (setting) => {
    setSelectedSetting(setting);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEdit = (setting) => {
    setSelectedSetting(setting);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedSetting({
      key: '',
      value: '',
      setting_type: 'text',
      category: 'general',
      description: '',
      is_active: true
    });
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSetting(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SettingsIcon />
        إدارة الإعدادات
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="البحث في الإعدادات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            بحث
          </Button>
          <Button
            variant="outlined"
            onClick={fetchSettings}
          >
            إعادة تحميل
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={settings}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
          }}
          slots={{
            toolbar: () => <CustomToolbar onAdd={handleAdd} />,
          }}
          sx={{
            '& .MuiDataGrid-root': {
              direction: 'rtl',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
            },
          }}
        />
      </Paper>

      {/* Settings Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'view' && 'عرض تفاصيل الإعداد'}
          {dialogMode === 'edit' && 'تعديل الإعداد'}
          {dialogMode === 'add' && 'إضافة إعداد جديد'}
        </DialogTitle>
        <DialogContent>
          {selectedSetting && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="المفتاح"
                  value={selectedSetting.key || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>النوع</InputLabel>
                  <Select
                    value={selectedSetting.setting_type || 'text'}
                    label="النوع"
                  >
                    <MenuItem value="text">نص</MenuItem>
                    <MenuItem value="number">رقم</MenuItem>
                    <MenuItem value="boolean">منطقي</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="file">ملف</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="القيمة"
                  value={selectedSetting.value || ''}
                  multiline
                  rows={selectedSetting.setting_type === 'json' ? 4 : 2}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الفئة"
                  value={selectedSetting.category || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedSetting.is_active || false}
                      disabled={dialogMode === 'view'}
                    />
                  }
                  label="نشط"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الوصف"
                  value={selectedSetting.description || ''}
                  multiline
                  rows={2}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              {dialogMode === 'view' && selectedSetting.typed_value && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="القيمة المحولة"
                    value={JSON.stringify(selectedSetting.typed_value)}
                    disabled
                    multiline
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'إغلاق' : 'إلغاء'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleCloseDialog}>
              {dialogMode === 'add' ? 'إضافة' : 'حفظ'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsManagement;
