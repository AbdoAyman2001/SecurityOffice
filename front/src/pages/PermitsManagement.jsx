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
  Warning as WarningIcon,
} from '@mui/icons-material';
import { permitsApi } from '../services/apiService';

const CustomToolbar = ({ onAdd }) => {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mr: 1 }}
      >
        إضافة تصريح جديد
      </Button>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

const PermitsManagement = () => {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view');

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      case 'expired': return 'منتهي الصلاحية';
      default: return status;
    }
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const columns = [
    {
      field: 'permit_id',
      headerName: 'رقم التصريح',
      width: 120,
    },
    {
      field: 'permit_type',
      headerName: 'نوع التصريح',
      width: 150,
    },
    {
      field: 'person_name',
      headerName: 'اسم الشخص',
      width: 200,
      valueGetter: (params) => params.row.person?.full_name_arabic || 'غير محدد',
    },
    {
      field: 'issue_date',
      headerName: 'تاريخ الإصدار',
      width: 130,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString('ar-EG');
        }
        return '';
      },
    },
    {
      field: 'expiry_date',
      headerName: 'تاريخ الانتهاء',
      width: 130,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString('ar-EG');
        }
        return '';
      },
      renderCell: (params) => {
        const isExpiring = isExpiringSoon(params.value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {params.value ? new Date(params.value).toLocaleDateString('ar-EG') : ''}
            </Typography>
            {isExpiring && (
              <WarningIcon color="warning" fontSize="small" />
            )}
          </Box>
        );
      },
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
      field: 'purpose',
      headerName: 'الغرض',
      width: 200,
      flex: 1,
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
    fetchPermits();
  }, []);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      const response = await permitsApi.getAll();
      setPermits(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching permits:', err);
      setError('حدث خطأ في تحميل بيانات التصاريح');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPermits();
      return;
    }

    try {
      setLoading(true);
      const response = await permitsApi.getAll({
        search: searchTerm,
      });
      setPermits(response.data.results || response.data);
    } catch (err) {
      console.error('Error searching permits:', err);
      setError('حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (permit) => {
    setSelectedPermit(permit);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEdit = (permit) => {
    setSelectedPermit(permit);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedPermit(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPermit(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        إدارة التصاريح
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="البحث في التصاريح..."
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
            onClick={fetchPermits}
          >
            إعادة تحميل
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              // Filter expiring permits
              const expiring = permits.filter(p => isExpiringSoon(p.expiry_date));
              setPermits(expiring);
            }}
          >
            التصاريح المنتهية قريباً ({permits.filter(p => isExpiringSoon(p.expiry_date)).length})
          </Button>
          <Button
            variant="outlined"
            color="success"
            onClick={() => {
              // Filter active permits
              const active = permits.filter(p => p.status === 'approved');
              setPermits(active);
            }}
          >
            التصاريح النشطة ({permits.filter(p => p.status === 'approved').length})
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={permits}
          columns={columns}
          getRowId={(row) => row.permit_id}
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

      {/* Permit Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'view' && 'عرض تفاصيل التصريح'}
          {dialogMode === 'edit' && 'تعديل التصريح'}
          {dialogMode === 'add' && 'إضافة تصريح جديد'}
        </DialogTitle>
        <DialogContent>
          {selectedPermit && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="نوع التصريح"
                  value={selectedPermit.permit_type || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم التصريح"
                  value={selectedPermit.permit_number || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ الإصدار"
                  type="date"
                  value={selectedPermit.issue_date?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ الانتهاء"
                  type="date"
                  value={selectedPermit.expiry_date?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>الحالة</InputLabel>
                  <Select
                    value={selectedPermit.status || ''}
                    label="الحالة"
                  >
                    <MenuItem value="pending">في الانتظار</MenuItem>
                    <MenuItem value="approved">موافق عليه</MenuItem>
                    <MenuItem value="rejected">مرفوض</MenuItem>
                    <MenuItem value="expired">منتهي الصلاحية</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الجهة المصدرة"
                  value={selectedPermit.issuing_authority || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="الغرض من التصريح"
                  value={selectedPermit.purpose || ''}
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ملاحظات"
                  value={selectedPermit.notes || ''}
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

export default PermitsManagement;
