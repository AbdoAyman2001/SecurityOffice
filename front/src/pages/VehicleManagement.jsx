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
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { vehiclesApi } from '../services/apiService';

const CustomToolbar = ({ onAdd }) => {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mr: 1 }}
      >
        إضافة مركبة جديدة
      </Button>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view');

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'maintenance': return 'warning';
      case 'retired': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'inactive': return 'غير نشطة';
      case 'maintenance': return 'في الصيانة';
      case 'retired': return 'خارج الخدمة';
      default: return status;
    }
  };

  const columns = [
    {
      field: 'vehicle_id',
      headerName: 'رقم المركبة',
      width: 120,
    },
    {
      field: 'make',
      headerName: 'الماركة',
      width: 120,
    },
    {
      field: 'model',
      headerName: 'الموديل',
      width: 120,
    },
    {
      field: 'year',
      headerName: 'سنة الصنع',
      width: 100,
    },
    {
      field: 'license_plate',
      headerName: 'رقم اللوحة',
      width: 150,
    },
    {
      field: 'color',
      headerName: 'اللون',
      width: 100,
    },
    {
      field: 'owner_name',
      headerName: 'اسم المالك',
      width: 200,
      valueGetter: (params) => params.row.owner?.full_name_arabic || 'غير محدد',
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusText(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'insurance_expiry',
      headerName: 'انتهاء التأمين',
      width: 130,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString('ar-EG');
        }
        return '';
      },
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 200,
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

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehiclesApi.getAll();
      setVehicles(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('حدث خطأ في تحميل بيانات المركبات');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchVehicles();
      return;
    }

    try {
      setLoading(true);
      const response = await vehiclesApi.getAll({
        search: searchTerm,
      });
      setVehicles(response.data.results || response.data);
    } catch (err) {
      console.error('Error searching vehicles:', err);
      setError('حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedVehicle(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedVehicle(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        إدارة المركبات
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="البحث برقم اللوحة أو الماركة أو المالك..."
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
            onClick={fetchVehicles}
          >
            إعادة تحميل
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={vehicles}
          columns={columns}
          getRowId={(row) => row.vehicle_id}
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

      {/* Vehicle Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'view' && 'عرض تفاصيل المركبة'}
          {dialogMode === 'edit' && 'تعديل المركبة'}
          {dialogMode === 'add' && 'إضافة مركبة جديدة'}
        </DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الماركة"
                  value={selectedVehicle.make || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الموديل"
                  value={selectedVehicle.model || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="سنة الصنع"
                  type="number"
                  value={selectedVehicle.year || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم اللوحة"
                  value={selectedVehicle.license_plate || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="اللون"
                  value={selectedVehicle.color || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>الحالة</InputLabel>
                  <Select
                    value={selectedVehicle.status || ''}
                    label="الحالة"
                  >
                    <MenuItem value="active">نشطة</MenuItem>
                    <MenuItem value="inactive">غير نشطة</MenuItem>
                    <MenuItem value="maintenance">في الصيانة</MenuItem>
                    <MenuItem value="retired">خارج الخدمة</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم الشاسيه"
                  value={selectedVehicle.vin || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم المحرك"
                  value={selectedVehicle.engine_number || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ انتهاء التأمين"
                  type="date"
                  value={selectedVehicle.insurance_expiry?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ انتهاء الرخصة"
                  type="date"
                  value={selectedVehicle.registration_expiry?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ملاحظات"
                  value={selectedVehicle.notes || ''}
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'إغلاق' : 'إلغاء'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleCloseDialog}>
              {dialogMode === 'add' ? 'إضافة' : 'حفظ'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleManagement;
