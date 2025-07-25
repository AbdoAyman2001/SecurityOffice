import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  Skeleton,
  Button
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  AttachFile as AttachFileIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ColumnFilter from './ColumnFilter';
import InlineEditCell from '../RussianLetters/InlineEditCell';

const UniversalDataTable = ({
  // Data props
  data = [],
  loading = false,
  error = null,
  hasMore = false,
  totalCount = 0,
  
  // Column configuration
  columns = [],
  
  // Infinite scroll
  onLoadMore,
  
  // Sorting
  sortConfig = { field: null, direction: null },
  onSort,
  
  // Filtering
  columnFilters = {},
  onColumnFilter,
  onClearColumnFilter,
  getColumnUniqueValues,
  
  // Advanced filtering
  advancedFilters = [],
  onAdvancedFilter,
  
  // Search
  searchTerm = '',
  onSearch,
  
  // Actions
  onUpdateItem,
  onViewItem,
  onEditItem,
  
  // Customization
  enableInlineEdit = true,
  enableActions = true,
  enableFilters = true,
  enableSort = true,
  enableInfiniteScroll = true,
  
  // Styling
  stickyHeader = true,
  highlightPriority = true,
  showLoadingSkeletons = true,
  
  // Permissions
  canEdit = false,
  canView = true,
  
  // Custom renderers
  customCellRenderers = {},
  
  // Table configuration
  pageSize = 50,
  emptyMessage = 'لا توجد بيانات',
  loadingMessage = 'جاري تحميل المزيد...'
}) => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);
  const loadingRef = useRef(null);
  const isLoadingRef = useRef(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Intersection Observer for infinite scroll
  const observerCallback = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading && !isLoadingRef.current && onLoadMore) {
      isLoadingRef.current = true;
      onLoadMore();
      // Reset the loading ref after a delay
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 1000);
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    if (loadingRef.current && enableInfiniteScroll) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [observerCallback, enableInfiniteScroll]);

  // Scroll event handler for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const scrollTop = tableContainerRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
      }
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Get cell value with fallback
  const getCellValue = (row, column) => {
    if (customCellRenderers[column.id]) {
      return customCellRenderers[column.id](row);
    }

    if (column.getValue) {
      return column.getValue(row);
    }

    // Handle nested object access
    const keys = column.id.split('.');
    let value = row;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) {
        break;
      }
    }

    return value || column.defaultValue || 'غير محدد';
  };

  // Render cell content
  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row);
    }

    if (customCellRenderers[column.id]) {
      return customCellRenderers[column.id](row);
    }

    const value = getCellValue(row, column);

    // Handle inline editing
    if (enableInlineEdit && column.editable && canEdit) {
      return (
        <InlineEditCell
          value={value}
          type={column.type || 'text'}
          options={column.options}
          onSave={(id, field, newValue) => onUpdateItem?.(row[column.primaryKey || 'id'], field, newValue)}
          editable={canEdit}
          fieldName={column.id}
          rowId={row[column.primaryKey || 'id']}
          multiline={column.multiline}
        />
      );
    }

    // Handle different data types
    switch (column.type) {
      case 'number':
        if (column.id === 'correspondence_id') {
          return (
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              #{value}
            </Typography>
          );
        }
        return (
          <Typography variant="body2">
            {value || 'غير محدد'}
          </Typography>
        );
      
      case 'priority':
        return (
          <Chip
            label={value === 'high' ? 'عالية' : value === 'low' ? 'منخفضة' : 'عادية'}
            color={value === 'high' ? 'error' : value === 'low' ? 'default' : 'primary'}
            size="small"
          />
        );
      
      case 'direction':
        const directionMap = {
          'Incoming': 'وارد',
          'Outgoing': 'صادر',
          'Internal': 'داخلي'
        };
        return (
          <Chip
            label={directionMap[value] || value || 'غير محدد'}
            color={value === 'Incoming' ? 'primary' : value === 'Outgoing' ? 'secondary' : 'default'}
            size="small"
          />
        );
      
      case 'date':
        return (
          <Typography variant="body2">
            {value ? new Date(value).toLocaleDateString('ar-EG') : 'غير محدد'}
          </Typography>
        );
      
      case 'datetime':
        return (
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {value ? new Date(value).toLocaleString('ar-EG') : 'غير محدد'}
          </Typography>
        );
      
      case 'attachments':
        const attachments = Array.isArray(value) ? value : [];
        if (attachments.length === 0) {
          return (
            <Typography variant="body2" color="textSecondary">
              لا توجد مرفقات
            </Typography>
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${attachments.length} مرفق`}
              color="info"
              size="small"
              icon={<AttachFileIcon />}
            />
            <Tooltip title="عرض المرفقات">
              <IconButton
                size="small"
                onClick={() => {
                  console.log('View attachments:', attachments);
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      
      case 'status_logs':
        const logs = Array.isArray(value) ? value : [];
        if (logs.length === 0) {
          return (
            <Typography variant="body2" color="textSecondary">
              لا يوجد سجل
            </Typography>
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${logs.length} إدخال`}
              color="default"
              size="small"
              icon={<HistoryIcon />}
            />
            <Tooltip title="عرض سجل الحالات">
              <IconButton
                size="small"
                onClick={() => {
                  console.log('View status logs:', logs);
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      
      case 'parent_correspondence':
        if (!row.parent_correspondence) {
          return (
            <Typography variant="body2" color="textSecondary">
              لا يوجد
            </Typography>
          );
        }
        return (
          <Tooltip title={`المراسلة الأصل: ${row.parent_correspondence.reference_number}`}>
            <Chip
              label={row.parent_correspondence.reference_number}
              color="secondary"
              size="small"
              variant="outlined"
            />
          </Tooltip>
        );
      
      case 'boolean':
        return (
          <Chip
            label={value ? 'نعم' : 'لا'}
            color={value ? 'success' : 'default'}
            size="small"
          />
        );
      
      case 'array':
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {Array.isArray(value) && value.length > 0 ? (
              value.slice(0, 3).map((item, index) => (
                <Chip key={index} label={item} size="small" variant="outlined" />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">غير محدد</Typography>
            )}
            {Array.isArray(value) && value.length > 3 && (
              <Chip label={`+${value.length - 3}`} size="small" color="primary" />
            )}
          </Box>
        );
      
      default:
        return (
          <Typography variant="body2" sx={{ 
            maxWidth: column.width || 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: column.multiline ? 'normal' : 'nowrap'
          }}>
            {value || 'غير محدد'}
          </Typography>
        );
    }
  };

  // Render actions column
  const renderActions = (row) => {
    if (!enableActions) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {canView && onViewItem && (
          <Tooltip title="عرض">
            <IconButton
              size="small"
              onClick={() => onViewItem(row)}
              color="primary"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {canEdit && onEditItem && (
          <Tooltip title="تعديل">
            <IconButton
              size="small"
              onClick={() => onEditItem(row)}
              color="secondary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => {
    if (!showLoadingSkeletons) return null;

    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((column) => (
          <TableCell key={column.id}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
        {enableActions && (
          <TableCell>
            <Skeleton variant="rectangular" width={80} height={32} />
          </TableCell>
        )}
      </TableRow>
    ));
  };

  // Get row background color
  const getRowBackgroundColor = (row) => {
    if (!highlightPriority) return 'transparent';
    
    // Check for priority field in various possible locations
    const priority = row.priority || row.Priority || 
                    (row.correspondence && row.correspondence.priority);
    
    return priority === 'high' ? '#ffebee' : 'transparent';
  };

  // Get row hover color
  const getRowHoverColor = (row) => {
    if (!highlightPriority) return 'action.hover';
    
    const priority = row.priority || row.Priority || 
                    (row.correspondence && row.correspondence.priority);
    
    return priority === 'high' ? '#ffcdd2' : 'action.hover';
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <TableContainer
        component={Paper}
        ref={tableContainerRef}
        sx={{
          maxHeight: '70vh',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#a8a8a8'
          }
        }}
      >
        <Table stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    width: column.width,
                    minWidth: column.minWidth || 100,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 600,
                    position: stickyHeader ? 'sticky' : 'static',
                    top: 0,
                    zIndex: 100
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {enableSort && column.sortable ? (
                      <TableSortLabel
                        active={sortConfig.field === column.id}
                        direction={sortConfig.field === column.id ? sortConfig.direction : 'asc'}
                        onClick={() => onSort?.(column.id)}
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

                    {enableFilters && column.filterable && getColumnUniqueValues && (
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
              
              {enableActions && (
                <TableCell
                  sx={{
                    width: 120,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 600,
                    position: stickyHeader ? 'sticky' : 'static',
                    top: 0,
                    zIndex: 100
                  }}
                >
                  الإجراءات
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (enableActions ? 1 : 0)} align="center">
                  <Typography variant="body1" color="textSecondary" sx={{ p: 4 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((row, index) => {
                  const rowKey = row[columns.find(c => c.primaryKey)?.id] || 
                               row.id || 
                               row.correspondence_id || 
                               index;
                  
                  return (
                    <TableRow
                      key={rowKey}
                      sx={{
                        backgroundColor: getRowBackgroundColor(row),
                        '&:hover': {
                          backgroundColor: getRowHoverColor(row)
                        }
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={column.id} 
                          sx={{ 
                            width: column.width,
                            minWidth: column.minWidth || 100
                          }}
                        >
                          {renderCell(row, column)}
                        </TableCell>
                      ))}
                      
                      {enableActions && (
                        <TableCell sx={{ width: 120 }}>
                          {renderActions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

                {loading && renderLoadingSkeleton()}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Infinite scroll loading indicator */}
      {enableInfiniteScroll && (
        <div ref={loadingRef} style={{ height: '20px', margin: '10px 0' }}>
          {loading && data.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {loadingMessage}
              </Typography>
            </Box>
          )}
        </div>
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
            zIndex: 1000,
            boxShadow: 3
          }}
        >
          <ArrowUpIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default UniversalDataTable;
