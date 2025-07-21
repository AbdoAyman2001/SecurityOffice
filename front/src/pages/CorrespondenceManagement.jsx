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
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { correspondenceApi } from '../services/apiService';

const CustomToolbar = ({ onAdd }) => {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mr: 1 }}
      >
        إضافة مراسلة جديدة
      </Button>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

const CorrespondenceManagement = () => {
  const [correspondence, setCorrespondence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorrespondence, setSelectedCorrespondence] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view');

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'in_progress': return 'قيد المعالجة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const columns = [
    {
      field: 'correspondence_id',
      headerName: 'رقم المراسلة',
      width: 120,
    },
    {
      field: 'subject',
      headerName: 'الموضوع',
      width: 300,
      flex: 1,
    },
    {
      field: 'correspondence_type_name',
      headerName: 'نوع المراسلة',
      width: 150,
      valueGetter: (params) => params.row.correspondence_type?.type_name || 'غير محدد',
    },
    {
      field: 'sender_name',
      headerName: 'المرسل',
      width: 200,
      valueGetter: (params) => params.row.sender?.full_name_arabic || 'غير محدد',
    },
    {
      field: 'date_received',
      headerName: 'تاريخ الاستلام',
      width: 150,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString('ar-EG');
        }
        return '';
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
      field: 'priority',
      headerName: 'الأولوية',
      width: 100,
      renderCell: (params) => {
        const priorityColors = {
          low: 'success',
          medium: 'warning',
          high: 'error',
        };
        const priorityText = {
          low: 'منخفضة',
          medium: 'متوسطة',
          high: 'عالية',
        };
        return (
          <Chip
            label={priorityText[params.value] || params.value}
            color={priorityColors[params.value] || 'default'}
            size="small"
          />
        );
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
    fetchCorrespondence();
  }, []);

  const fetchCorrespondence = async () => {
    try {
      setLoading(true);
      const response = await correspondenceApi.getAll();
      setCorrespondence(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching correspondence:', err);
      setError('حدث خطأ في تحميل بيانات المراسلات');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCorrespondence();
      return;
    }

    try {
      setLoading(true);
      const response = await correspondenceApi.getAll({
        search: searchTerm,
      });
      setCorrespondence(response.data.results || response.data);
    } catch (err) {
      console.error('Error searching correspondence:', err);
      setError('حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    setSelectedCorrespondence(item);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedCorrespondence(item);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedCorrespondence(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCorrespondence(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        إدارة المراسلات
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="البحث في الموضوع أو المرسل..."
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
            onClick={fetchCorrespondence}
          >
            إعادة تحميل
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={correspondence}
          columns={columns}
          getRowId={(row) => row.correspondence_id}
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

      {/* Correspondence Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'view' && 'عرض تفاصيل المراسلة'}
          {dialogMode === 'edit' && 'تعديل المراسلة'}
          {dialogMode === 'add' && 'إضافة مراسلة جديدة'}
        </DialogTitle>
        <DialogContent>
          {selectedCorrespondence && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الموضوع"
                  value={selectedCorrespondence.subject || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم المراسلة"
                  value={selectedCorrespondence.correspondence_number || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ الاستلام"
                  type="date"
                  value={selectedCorrespondence.date_received?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>الحالة</InputLabel>
                  <Select
                    value={selectedCorrespondence.status || ''}
                    label="الحالة"
                  >
                    <MenuItem value="pending">في الانتظار</MenuItem>
                    <MenuItem value="in_progress">قيد المعالجة</MenuItem>
                    <MenuItem value="completed">مكتملة</MenuItem>
                    <MenuItem value="cancelled">ملغاة</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>الأولوية</InputLabel>
                  <Select
                    value={selectedCorrespondence.priority || ''}
                    label="الأولوية"
                  >
                    <MenuItem value="low">منخفضة</MenuItem>
                    <MenuItem value="medium">متوسطة</MenuItem>
                    <MenuItem value="high">عالية</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ الاستحقاق"
                  type="date"
                  value={selectedCorrespondence.due_date?.split('T')[0] || ''}
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="المحتوى"
                  value={selectedCorrespondence.content || ''}
                  multiline
                  rows={4}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ملاحظات"
                  value={selectedCorrespondence.notes || ''}
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              {selectedCorrespondence.attachments && selectedCorrespondence.attachments.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    المرفقات
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedCorrespondence.attachments.map((attachment, index) => (
                      <Chip
                        key={index}
                        icon={<AttachFileIcon />}
                        label={attachment.file_name || `مرفق ${index + 1}`}
                        clickable
                        color="primary"
                        variant="outlined"
                      />
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

export default CorrespondenceManagement;
