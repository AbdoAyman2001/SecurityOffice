import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { correspondenceApi } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const RussianLetters = () => {
  const navigate = useNavigate();
  const { isAuthenticated, canEditCorrespondence, hasPermission } = useAuth();

  // State management
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Fetch letters data
  const fetchLetters = async (searchQuery = '', pageNum = 0, pageSize = 10) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pageNum + 1, // API usually uses 1-based pagination
        page_size: pageSize,
        direction: 'Incoming', // Filter for Russian letters (incoming)
        ...(searchQuery && { search: searchQuery })
      };

      const response = await correspondenceApi.getAll(params);
      const data = response.data;

      setLetters(data.results || data || []);
      setTotalCount(data.count || data.length || 0);
    } catch (err) {
      console.error('Error fetching letters:', err);
      setError('فشل في تحميل بيانات الخطابات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(0);
    fetchLetters(value, 0, rowsPerPage);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchLetters(searchTerm, newPage, rowsPerPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchLetters(searchTerm, 0, newRowsPerPage);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLetters(searchTerm, page, rowsPerPage);
  };

  // Handle view letter
  const handleViewLetter = (letterId) => {
    navigate(`/correspondence/${letterId}`);
  };

  // Handle edit letter
  const handleEditLetter = (letterId) => {
    navigate(`/correspondence/${letterId}/edit`);
  };

  // Handle add new letter
  const handleAddLetter = () => {
    navigate('/forms/russian-letter');
  };

  // Get priority color and label
  const getPriorityDisplay = (priority) => {
    const priorityMap = {
      high: { label: 'عالية', color: 'error', bgColor: '#ffebee' },
      normal: { label: 'عادية', color: 'default', bgColor: 'transparent' },
      low: { label: 'منخفضة', color: 'info', bgColor: 'transparent' }
    };
    return priorityMap[priority] || priorityMap.normal;
  };

  // Get status display
  const getStatusDisplay = (status) => {
    if (!status) return 'غير محدد';
    return status.procedure_name || status.description || status.status || 'غير محدد';
  };

  // Get assigned user display
  const getAssignedUserDisplay = (assignedTo) => {
    if (!assignedTo) return 'غير مخصص';
    return assignedTo.username || assignedTo.first_name || assignedTo.email || 'غير محدد';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  // Check if user can view correspondence (fallback to authenticated user)
  const canViewCorrespondence = () => {
    // Always allow authenticated users to view, regardless of specific permissions
    return isAuthenticated;
  };

  // Check permissions on mount
  useEffect(() => {
    if (!canViewCorrespondence()) {
      setError('ليس لديك الصلاحية لعرض الخطابات.');
      return;
    }
    
    fetchLetters();
  }, [isAuthenticated]);

  // Show permission error
  if (!canViewCorrespondence()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
          الخطابات الروسية
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLetter}
          sx={{ borderRadius: 2 }}
        >
          إضافة خطاب جديد
        </Button>
      </Box>

      {/* Search and Controls */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="البحث في الخطابات..."
            value={searchTerm}
            onChange={handleSearch}
            variant="outlined"
            size="small"
            sx={{ minWidth: 300, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Tooltip title="تحديث البيانات">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>رقم الإشارة</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>التاريخ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>النوع</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>الموضوع</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>الأولوية</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>الحالة</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>المخصص إليه</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>جاري تحميل البيانات...</Typography>
                  </TableCell>
                </TableRow>
              ) : letters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      لا توجد خطابات للعرض
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                letters.map((letter) => {
                  const priorityDisplay = getPriorityDisplay(letter.priority);
                  return (
                    <TableRow
                      key={letter.correspondence_id}
                      sx={{
                        backgroundColor: letter.priority === 'high' ? priorityDisplay.bgColor : 'transparent',
                        '&:hover': {
                          backgroundColor: letter.priority === 'high' ? '#ffcdd2' : 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        {letter.reference_number || 'غير محدد'}
                      </TableCell>
                      
                      <TableCell>
                        {formatDate(letter.correspondence_date)}
                      </TableCell>
                      
                      <TableCell>
                        {letter.type?.type_name || 'غير محدد'}
                      </TableCell>
                      
                      <TableCell>
                        <Tooltip title={letter.subject || 'بدون موضوع'}>
                          <Typography
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {letter.subject || 'بدون موضوع'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={priorityDisplay.label}
                          color={priorityDisplay.color}
                          size="small"
                          variant={letter.priority === 'high' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      
                      <TableCell>
                        {getStatusDisplay(letter.current_status)}
                      </TableCell>
                      
                      <TableCell>
                        {getAssignedUserDisplay(letter.assigned_to)}
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="عرض التفاصيل">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewLetter(letter.correspondence_id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {canEditCorrespondence() && (
                            <Tooltip title="تعديل">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleEditLetter(letter.correspondence_id)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="عدد الصفوف في الصفحة:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
};

export default RussianLetters;
