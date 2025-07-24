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
        إضافة خطاب جديدة
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
      headerName: 'رقم الخطاب',
      width: 120,
      editable: false,
    },
    {
      field: 'reference_number',
      headerName: 'رقم المرجع',
      width: 150,
      editable: true,
    },
    {
      field: 'subject',
      headerName: 'الموضوع',
      width: 300,
      flex: 1,
      editable: true,
    },
    {
      field: 'type_name',
      headerName: 'نوع الخطاب',
      width: 150,
      editable: false,
      renderCell: (params) => {
        return params?.row?.type_name || 'غير محدد';
      },
    },
    {
      field: 'direction',
      headerName: 'الاتجاه',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: 'Incoming', label: 'واردة' },
        { value: 'Outgoing', label: 'صادرة' },
        { value: 'Internal', label: 'داخلية' },
      ],
      renderCell: (params) => {
        const directionLabels = {
          'Incoming': 'واردة',
          'Outgoing': 'صادرة',
          'Internal': 'داخلية'
        };
        return directionLabels[params?.value] || params?.value || 'غير محدد';
      },
    },
    {
      field: 'correspondence_date',
      headerName: 'تاريخ الخطاب',
      width: 150,
      type: 'date',
      editable: true,
      valueGetter: (params) => {
        return params?.row?.correspondence_date ? new Date(params.row.correspondence_date) : null;
      },
      renderCell: (params) => {
        if (params?.row?.correspondence_date) {
          return new Date(params.row.correspondence_date).toLocaleDateString('ar-EG');
        }
        return 'غير محدد';
      },
    },
    {
      field: 'priority',
      headerName: 'الأولوية',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: 'low', label: 'منخفضة' },
        { value: 'normal', label: 'عادية' },
        { value: 'high', label: 'عالية' },
      ],
      renderCell: (params) => {
        const priorityColors = {
          low: 'success',
          normal: 'default',
          high: 'error',
        };
        const priorityText = {
          low: 'منخفضة',
          normal: 'عادية',
          high: 'عالية',
        };
        return (
          <Chip
            label={priorityText[params?.value] || params?.value || 'غير محدد'}
            color={priorityColors[params?.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'current_status',
      headerName: 'الحالة',
      width: 150,
      editable: false,
      renderCell: (params) => {
        const statusText = params?.row?.current_status?.procedure_name || 'غير محدد';
        return (
          <Chip
            label={statusText}
            color={params?.row?.current_status ? 'primary' : 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'summary',
      headerName: 'ملخص',
      width: 200,
      editable: true,
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
      setError('حدث خطأ في تحميل بيانات الخطابات');
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

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleProcessRowUpdate = async (newRow) => {
    try {
      // Format date fields to YYYY-MM-DD format for backend
      const formattedRow = { ...newRow };
      
      // List of date fields that need formatting
      const dateFields = ['correspondence_date', 'due_date', 'date_received'];
      
      // Convert all date fields to YYYY-MM-DD format if they are Date objects
      dateFields.forEach(field => {
        if (formattedRow[field] instanceof Date) {
          formattedRow[field] = formattedRow[field].toISOString().split('T')[0];
        } else if (formattedRow[field] && typeof formattedRow[field] === 'string') {
          // If it's already a string, ensure it's in the correct format
          const date = new Date(formattedRow[field]);
          if (!isNaN(date.getTime())) {
            formattedRow[field] = date.toISOString().split('T')[0];
          }
        }
      });
      
      // Update the correspondence via API
      const response = await correspondenceApi.update(newRow.correspondence_id, formattedRow);
      
      // Update the local state with the original row data (not formatted)
      setCorrespondence(prev => 
        prev.map(row => 
          row.correspondence_id === newRow.correspondence_id ? { ...row, ...newRow } : row
        )
      );
      
      return newRow;
    } catch (error) {
      console.error('Error updating correspondence:', error);
      // Log the error details for debugging
      if (error.response?.data) {
        console.error('API Error Details:', error.response.data);
      }
      throw error;
    }
  };

  const handleProcessRowUpdateError = (error) => {
    console.error('Row update error:', error);
    setError('فشل في حفظ التغييرات. يرجى المحاولة مرة أخرى.');
  };

  const handleAdd = () => {
    // Navigate to LetterForm for adding new correspondence
    window.location.href = '/letter-form';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        إدارة الخطابات
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
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row.correspondence_id}
          experimentalFeatures={{ newEditingApi: true }}
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          components={{
            Toolbar: () => <CustomToolbar onAdd={handleAdd} />,
          }}
          sx={{
            height: 600,
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              color: '#333',
              fontSize: 16,
            },
            '& .MuiDataGrid-cell--editable': {
              backgroundColor: '#f9f9f9',
            },
            '& .MuiDataGrid-cell--editing': {
              backgroundColor: '#e3f2fd',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default CorrespondenceManagement;
