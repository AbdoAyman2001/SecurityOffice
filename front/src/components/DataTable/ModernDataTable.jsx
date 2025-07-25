import React, { useEffect, useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ColumnFilter from './ColumnFilter';
import InlineEditCell from '../RussianLetters/InlineEditCell';

const ModernDataTable = ({
  data,
  loading,
  error,
  hasMore,
  onLoadMore,
  sortConfig,
  onSort,
  columnFilters,
  onColumnFilter,
  onClearColumnFilter,
  onUpdateItem,
  getColumnUniqueValues
}) => {
  const navigate = useNavigate();
  const { canEditCorrespondence } = useAuth();
  const tableContainerRef = useRef(null);
  const loadingRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Column definitions based on actual Correspondence model fields
  const columns = [
    {
      id: 'reference_number',
      label: 'الرقم المرجعي',
      sortable: true,
      filterable: true,
      editable: canEditCorrespondence(),
      width: 150,
      getValue: (row) => row.reference_number || 'غير محدد',
      render: (row) => (
        <InlineEditCell
          value={row.reference_number}
          type="text"
          onSave={(id, field, value) => onUpdateItem(row.correspondence_id, field, value)}
          editable={canEditCorrespondence()}
          fieldName="reference_number"
          rowId={row.correspondence_id}
        />
      )
    },
    {
      id: 'correspondence_date',
      label: 'تاريخ المراسلة',
      sortable: true,
      filterable: true,
      editable: canEditCorrespondence(),
      width: 130,
      getValue: (row) => row.correspondence_date || 'غير محدد',
      render: (row) => (
        <InlineEditCell
          value={row.correspondence_date}
          type="date"
          onSave={(id, field, value) => onUpdateItem(row.correspondence_id, field, value)}
          editable={canEditCorrespondence()}
          fieldName="correspondence_date"
          rowId={row.correspondence_id}
        />
      )
    },
    {
      id: 'contact',
      label: 'جهة الاتصال',
      sortable: true,
      filterable: true,
      editable: false,
      width: 150,
      getValue: (row) => row.contact?.name || 'غير محدد',
      render: (row) => (
        <Typography variant="body2">
          {row.contact?.name || 'غير محدد'}
        </Typography>
      )
    },
    {
      id: 'type',
      label: 'النوع',
      sortable: true,
      filterable: true,
      editable: canEditCorrespondence(),
      width: 120,
      getValue: (row) => row.type?.type_name || 'غير محدد',
      render: (row) => (
        <Typography variant="body2">
          {row.type?.type_name || 'غير محدد'}
        </Typography>
      )
    },
    {
      id: 'subject',
      label: 'الموضوع',
      sortable: true,
      filterable: false,
      editable: canEditCorrespondence(),
      width: 200,
      getValue: (row) => row.subject || 'غير محدد',
      render: (row) => (
        <InlineEditCell
          value={row.subject}
          type="text"
          onSave={(id, field, value) => onUpdateItem(row.correspondence_id, field, value)}
          editable={canEditCorrespondence()}
          fieldName="subject"
          rowId={row.correspondence_id}
          multiline
        />
      )
    },
    {
      id: 'priority',
      label: 'الأولوية',
      sortable: true,
      filterable: true,
      editable: canEditCorrespondence(),
      width: 120,
      getValue: (row) => row.priority || 'normal',
      render: (row) => (
        <InlineEditCell
          value={row.priority}
          type="priority"
          options={[
            { value: 'high', label: 'عالية' },
            { value: 'normal', label: 'عادية' },
            { value: 'low', label: 'منخفضة' }
          ]}
          onSave={(id, field, value) => onUpdateItem(row.correspondence_id, field, value)}
          editable={canEditCorrespondence()}
          fieldName="priority"
          rowId={row.correspondence_id}
        />
      )
    },
    {
      id: 'current_status',
      label: 'الحالة الحالية',
      sortable: true,
      filterable: true,
      editable: false,
      width: 150,
      getValue: (row) => row.current_status?.procedure_name || 'غير محدد',
      render: (row) => (
        <Typography variant="body2">
          {row.current_status?.procedure_name || 'غير محدد'}
        </Typography>
      )
    },
    {
      id: 'assigned_to',
      label: 'المسؤول',
      sortable: true,
      filterable: true,
      editable: canEditCorrespondence(),
      width: 150,
      getValue: (row) => row.assigned_to?.full_name_arabic || row.assigned_to?.username || 'غير مخصص',
      render: (row) => (
        <Typography variant="body2">
          {row.assigned_to?.full_name_arabic || row.assigned_to?.username || 'غير مخصص'}
        </Typography>
      )
    },
    {
      id: 'actions',
      label: 'الإجراءات',
      sortable: false,
      filterable: false,
      editable: false,
      width: 120,
      getValue: () => '',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="عرض">
            <IconButton
              size="small"
              onClick={() => navigate(`/correspondence/${row.correspondence_id}`)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEditCorrespondence() && (
            <Tooltip title="تعديل">
              <IconButton
                size="small"
                onClick={() => navigate(`/correspondence/${row.correspondence_id}/edit`)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;

    // Show scroll to top button when scrolled down
    setShowScrollTop(scrollTop > 300);

    // Load more when 80% scrolled
    if (scrollPercentage > 80 && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Scroll to top function
  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((column) => (
          <TableCell key={column.id} sx={{ width: column.width }}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
      </TableRow>
    ))
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TableContainer 
        component={Paper} 
        ref={tableContainerRef}
        sx={{ 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{ 
                    width: column.width,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 600,
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {column.sortable ? (
                      <TableSortLabel
                        active={sortConfig.field === column.id}
                        direction={sortConfig.field === column.id ? sortConfig.direction : 'asc'}
                        onClick={() => onSort(column.id)}
                        sx={{ 
                          color: 'white !important',
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important'
                          }
                        }}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                    
                    {column.filterable && (
                      <ColumnFilter
                        column={column.id}
                        values={getColumnUniqueValues(column.id)}
                        selectedValues={columnFilters[column.id] || []}
                        onFilter={onColumnFilter}
                        onClear={onClearColumnFilter}
                        label={column.label}
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {data.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body1" color="textSecondary" sx={{ p: 4 }}>
                    لا توجد خطابات روسية
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((row) => {
                  const priorityBg = row.priority === 'high' ? '#ffebee' : 'transparent';
                  
                  return (
                    <TableRow
                      key={row.correspondence_id}
                      sx={{
                        backgroundColor: priorityBg,
                        '&:hover': {
                          backgroundColor: row.priority === 'high' ? '#ffcdd2' : 'action.hover'
                        }
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell key={column.id} sx={{ width: column.width }}>
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                
                {loading && renderLoadingSkeleton()}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Loading indicator at bottom */}
      {loading && data.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            جاري تحميل المزيد...
          </Typography>
        </Box>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <IconButton
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark'
            },
            zIndex: 1000
          }}
        >
          <ArrowUpIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default ModernDataTable;
