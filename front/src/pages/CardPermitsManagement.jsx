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
  Avatar,
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
  CreditCard as CardIcon,
  Photo as PhotoIcon,
} from '@mui/icons-material';
import { cardPermitsApi } from '../services/apiService';

const CustomToolbar = ({ onAdd }) => {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mr: 1 }}
      >
        إضافة بطاقة دخول جديدة
      </Button>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

const CardPermitsManagement = () => {
  const [cardPermits, setCardPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view');

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'inactive': return 'غير نشطة';
      case 'suspended': return 'معلقة';
      case 'expired': return 'منتهية الصلاحية';
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
      headerName: 'رقم البطاقة',
      width: 120,
    },
    {
      field: 'card_number',
      headerName: 'رقم البطاقة',
      width: 150,
    },
    {
      field: 'person_name',
      headerName: 'اسم الشخص',
      width: 200,
      valueGetter: (params) => params?.row?.person?.full_name_arabic || 'غير محدد',
    },
    {
      field: 'card_type',
      headerName: 'نوع البطاقة',
      width: 120,
      renderCell: (params) => {
        const typeColors = {
          employee: 'primary',
          visitor: 'secondary',
          contractor: 'warning',
          temporary: 'info',
        };
        const typeText = {
          employee: 'موظف',
          visitor: 'زائر',
          contractor: 'مقاول',
          temporary: 'مؤقت',
        };
        return (
          <Chip
            label={typeText[params.value] || params.value}
            color={typeColors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'issue_date',
      headerName: 'تاريخ الإصدار',
      width: 130,
      valueFormatter: (params) => {
        if (params?.value) {
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
        if (params?.value) {
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
      field: 'access_level',
      headerName: 'مستوى الوصول',
      width: 130,
    },
    {
      field: 'photo',
      headerName: 'الصورة',
      width: 80,
      renderCell: (params) => (
        <Avatar
          src={params.row.card_photos?.[0]?.photo_url}
          sx={{ width: 32, height: 32 }}
        >
          <PhotoIcon />
        </Avatar>
      ),
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
    fetchCardPermits();
  }, []);

  const fetchCardPermits = async () => {
    try {
      setLoading(true);
      const response = await cardPermitsApi.getAll();
      setCardPermits(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching card permits:', err);
      setError('حدث خطأ في تحميل بيانات بطاقات الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCardPermits();
      return;
    }

    try {
      setLoading(true);
      const response = await cardPermitsApi.getAll({
        search: searchTerm,
      });
      setCardPermits(response.data.results || response.data);
    } catch (err) {
      console.error('Error searching card permits:', err);
      setError('حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (card) => {
    setSelectedCard(card);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEdit = (card) => {
    setSelectedCard(card);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedCard(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCard(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        إدارة بطاقات الدخول
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="البحث برقم البطاقة أو اسم الشخص..."
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
            onClick={fetchCardPermits}
          >
            إعادة تحميل
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              // Filter expiring cards
              const expiring = cardPermits.filter(c => isExpiringSoon(c.expiry_date));
              setCardPermits(expiring);
            }}
          >
            البطاقات المنتهية قريباً ({cardPermits.filter(c => isExpiringSoon(c.expiry_date)).length})
          </Button>
          <Button
            variant="outlined"
            color="success"
            onClick={() => {
              // Filter active cards
              const active = cardPermits.filter(c => c.status === 'active');
              setCardPermits(active);
            }}
          >
            البطاقات النشطة ({cardPermits.filter(c => c.status === 'active').length})
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={cardPermits}
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

      {/* Card Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'view' && 'عرض تفاصيل البطاقة'}
          {dialogMode === 'edit' && 'تعديل البطاقة'}
          {dialogMode === 'add' && 'إضافة بطاقة دخول جديدة'}
        </DialogTitle>
        <DialogContent>
          {selectedCard && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم البطاقة"
                  value={selectedCard.card_number || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>نوع البطاقة</InputLabel>
                  <Select
                    value={selectedCard.card_type || ''}
                    label="نوع البطاقة"
                  >
                    <MenuItem value="employee">موظف</MenuItem>
                    <MenuItem value="visitor">زائر</MenuItem>
                    <MenuItem value="contractor">مقاول</MenuItem>
                    <MenuItem value="temporary">مؤقت</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ الإصدار"
                  type="date"
                  value={selectedCard.issue_date?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ الانتهاء"
                  type="date"
                  value={selectedCard.expiry_date?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>الحالة</InputLabel>
                  <Select
                    value={selectedCard.status || ''}
                    label="الحالة"
                  >
                    <MenuItem value="active">نشطة</MenuItem>
                    <MenuItem value="inactive">غير نشطة</MenuItem>
                    <MenuItem value="suspended">معلقة</MenuItem>
                    <MenuItem value="expired">منتهية الصلاحية</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="مستوى الوصول"
                  value={selectedCard.access_level || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الجهة المصدرة"
                  value={selectedCard.issuing_authority || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم الباركود"
                  value={selectedCard.barcode || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ملاحظات"
                  value={selectedCard.notes || ''}
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              {selectedCard.card_photos && selectedCard.card_photos.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    صور البطاقة
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {selectedCard.card_photos.map((photo, index) => (
                      <Avatar
                        key={index}
                        src={photo.photo_url}
                        sx={{ width: 80, height: 80 }}
                        variant="rounded"
                      >
                        <PhotoIcon />
                      </Avatar>
                    ))}
                  </Box>
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
            <Button variant="contained" onClick={handleCloseDialog}>
              {dialogMode === 'add' ? 'إضافة' : 'حفظ'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CardPermitsManagement;
