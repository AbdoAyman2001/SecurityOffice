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
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { peopleApi } from '../services/apiService';

const CustomToolbar = ({ onAdd }) => {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ mr: 1 }}
      >
        إضافة شخص جديد
      </Button>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
};

const PeopleManagement = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view', 'edit', 'add'

  const columns = [
    {
      field: 'person_record_id',
      headerName: 'رقم السجل',
      width: 100,
    },
    {
      field: 'full_name_arabic',
      headerName: 'الاسم بالعربية',
      width: 200,
      flex: 1,
    },
    {
      field: 'full_name_english',
      headerName: 'الاسم بالإنجليزية',
      width: 200,
      flex: 1,
    },
    {
      field: 'national_id',
      headerName: 'رقم الهوية',
      width: 150,
    },
    {
      field: 'nationality',
      headerName: 'الجنسية',
      width: 120,
    },
    {
      field: 'alive',
      headerName: 'الحالة',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'حي' : 'متوفى'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'is_current',
      headerName: 'السجل الحالي',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'حالي' : 'قديم'}
          color={params.value ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'version',
      headerName: 'الإصدار',
      width: 80,
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
          <Button
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => handleHistory(params.row)}
          >
            التاريخ
          </Button>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await peopleApi.getCurrentOnly();
      setPeople(response.data);
    } catch (err) {
      console.error('Error fetching people:', err);
      setError('حدث خطأ في تحميل بيانات الأشخاص');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPeople();
      return;
    }

    try {
      setLoading(true);
      const response = await peopleApi.getAll({
        search: searchTerm,
        is_current: true,
      });
      setPeople(response.data.results || response.data);
    } catch (err) {
      console.error('Error searching people:', err);
      setError('حدث خطأ في البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (person) => {
    setSelectedPerson(person);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleEdit = (person) => {
    setSelectedPerson(person);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedPerson(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleHistory = async (person) => {
    try {
      const response = await peopleApi.getHistory(person.person_record_id);
      console.log('Person history:', response.data);
      // You can implement a history dialog here
      alert(`تم العثور على ${response.data.length} سجل في تاريخ هذا الشخص`);
    } catch (err) {
      console.error('Error fetching person history:', err);
      setError('حدث خطأ في تحميل تاريخ الشخص');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPerson(null);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        إدارة الأشخاص
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="البحث بالاسم أو رقم الهوية..."
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
            onClick={fetchPeople}
          >
            إعادة تحميل
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={people}
          columns={columns}
          getRowId={(row) => row.person_record_id}
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

      {/* Person Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'view' && 'عرض بيانات الشخص'}
          {dialogMode === 'edit' && 'تعديل بيانات الشخص'}
          {dialogMode === 'add' && 'إضافة شخص جديد'}
        </DialogTitle>
        <DialogContent>
          {selectedPerson && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الاسم بالعربية"
                  value={selectedPerson.full_name_arabic || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الاسم بالإنجليزية"
                  value={selectedPerson.full_name_english || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم الهوية"
                  value={selectedPerson.national_id || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الجنسية"
                  value={selectedPerson.nationality || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاريخ الميلاد"
                  value={selectedPerson.birth_date || ''}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === 'view'}>
                  <InputLabel>الحالة</InputLabel>
                  <Select
                    value={selectedPerson.alive ? 'alive' : 'deceased'}
                    label="الحالة"
                  >
                    <MenuItem value="alive">حي</MenuItem>
                    <MenuItem value="deceased">متوفى</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ملاحظات"
                  value={selectedPerson.notes || ''}
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

export default PeopleManagement;
