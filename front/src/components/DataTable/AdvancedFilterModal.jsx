import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Divider,
  ButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { correspondenceTypesApi, peopleApi } from '../../services/apiService';

const AdvancedFilterModal = ({ 
  open,
  onClose,
  filters, 
  onFiltersChange, 
  onApply, 
  onClear
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalLogic, setGlobalLogic] = useState('AND'); // Global AND/OR logic

  // Simplified operators
  const operators = {
    text: [
      { value: 'contains', label: 'يحتوي على' },
      { value: 'equals', label: 'يساوي' },
      { value: 'not_contains', label: 'لا يحتوي على' }
    ],
    select: [
      { value: 'equals', label: 'يساوي' },
      { value: 'not_equals', label: 'لا يساوي' }
    ],
    date: [
      { value: 'equals', label: 'في تاريخ' },
      { value: 'before', label: 'قبل' },
      { value: 'after', label: 'بعد' }
    ]
  };

  // Simplified field definitions
  const fields = [
    { 
      id: 'reference_number', 
      label: 'الرقم المرجعي', 
      type: 'text',
      operators: operators.text
    },
    { 
      id: 'correspondence_date', 
      label: 'التاريخ', 
      type: 'date',
      operators: operators.date
    },
    { 
      id: 'priority', 
      label: 'الأولوية', 
      type: 'select',
      operators: operators.select,
      options: [
        { value: 'high', label: 'عالية' },
        { value: 'normal', label: 'عادية' },
        { value: 'low', label: 'منخفضة' }
      ]
    },
    { 
      id: 'current_status', 
      label: 'الحالة', 
      type: 'select',
      operators: operators.select,
      options: [
        { value: 'initial', label: 'حالة أولية' },
        { value: 'in_progress', label: 'قيد المعالجة' },
        { value: 'completed', label: 'مكتملة' },
        { value: 'cancelled', label: 'ملغية' }
      ]
    },
    { 
      id: 'direction', 
      label: 'الاتجاه', 
      type: 'select',
      operators: operators.select,
      options: [
        { value: 'Incoming', label: 'وارد' },
        { value: 'Outgoing', label: 'صادر' }
      ]
    }
  ];

  // Load filter options
  useEffect(() => {
    if (open) {
      const loadOptions = async () => {
        setLoading(true);
        try {
          const [typesResponse, usersResponse] = await Promise.all([
            correspondenceTypesApi.getAll(),
            peopleApi.getAll()
          ]);
          setCorrespondenceTypes(typesResponse.data?.results || typesResponse.data || []);
          setUsers(usersResponse.data?.results || usersResponse.data || []);
        } catch (error) {
          console.error('Error loading filter options:', error);
        } finally {
          setLoading(false);
        }
      };

      loadOptions();
    }
  }, [open]);

  // Update local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: '',
      operator: '',
      value: '',
      logic: localFilters.length > 0 ? globalLogic : null
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const removeFilter = (filterId) => {
    setLocalFilters(localFilters.filter(f => f.id !== filterId));
  };

  const updateFilter = (filterId, updates) => {
    setLocalFilters(localFilters.map(f => 
      f.id === filterId ? { ...f, ...updates } : f
    ));
  };

  const applyPredefinedFilter = (predefinedFilter) => {
    setLocalFilters(predefinedFilter.filters);
  };

  const handleApply = () => {
    // Validate filters before applying
    const validFilters = localFilters.filter(f => f.field && f.operator);
    if (validFilters.length === 0) {
      return;
    }
    
    // Add global logic to filters
    const filtersWithLogic = validFilters.map((filter, index) => ({
      ...filter,
      logic: index === 0 ? null : globalLogic
    }));
    
    onFiltersChange(filtersWithLogic);
    onApply(filtersWithLogic);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters([]);
    onFiltersChange([]);
    onClear();
  };

  const getFieldConfig = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  const renderValueInput = (filter) => {
    const fieldConfig = getFieldConfig(filter.field);
    if (!fieldConfig || !filter.operator) return null;

    switch (fieldConfig.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder={`أدخل ${fieldConfig.label}`}
            variant="outlined"
            sx={{ minWidth: 200 }}
          />
        );
      
      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            sx={{ minWidth: 200 }}
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth sx={{ minWidth: 200 }}>
            <InputLabel>اختر القيمة</InputLabel>
            <Select
              value={filter.value || ''}
              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
              label="اختر القيمة"
            >
              {fieldConfig.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      default:
        return null;
    }
  };

  const activeFiltersCount = localFilters.filter(f => 
    f.field && f.operator && (f.value !== '' || ['is_empty', 'is_not_empty', 'this_month', 'last_month', 'this_year'].includes(f.operator))
  ).length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          فلترة متقدمة
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Global Logic Selection */}
        {localFilters.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              طريقة ربط الشروط:
            </Typography>
            <ButtonGroup size="small" sx={{ mb: 2 }}>
              <Button 
                variant={globalLogic === 'AND' ? 'contained' : 'outlined'}
                onClick={() => setGlobalLogic('AND')}
              >
                جميع الشروط (AND)
              </Button>
              <Button 
                variant={globalLogic === 'OR' ? 'contained' : 'outlined'}
                onClick={() => setGlobalLogic('OR')}
              >
                أي شرط (OR)
              </Button>
            </ButtonGroup>
          </Box>
        )}

        {/* Filters */}
        <Box>
          
          {localFilters.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              لا توجد فلاتر. اضغط "إضافة فلتر" لبدء الفلترة.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {localFilters.map((filter, index) => (
                <Paper key={filter.id} elevation={1} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Field */}
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>الحقل</InputLabel>
                      <Select
                        value={filter.field || ''}
                        label="الحقل"
                        onChange={(e) => updateFilter(filter.id, { 
                          field: e.target.value, 
                          operator: '', 
                          value: '' 
                        })}
                      >
                        {fields.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Operator */}
                    <FormControl sx={{ minWidth: 150 }}>
                      <InputLabel>المشغل</InputLabel>
                      <Select
                        value={filter.operator || ''}
                        label="المشغل"
                        onChange={(e) => updateFilter(filter.id, { 
                          operator: e.target.value, 
                          value: '' 
                        })}
                        disabled={!filter.field}
                      >
                        {filter.field && getFieldConfig(filter.field)?.operators.map((op) => (
                          <MenuItem key={op.value} value={op.value}>
                            {op.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Value */}
                    <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                      {renderValueInput(filter)}
                    </Box>

                    {/* Remove button */}
                    <IconButton
                      color="error"
                      onClick={() => removeFilter(filter.id)}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  {/* Show logic indicator for multiple filters */}
                  {index > 0 && (
                    <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                      {globalLogic === 'AND' ? 'و (جميع الشروط السابقة)' : 'أو (أي من الشروط السابقة)'}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addFilter}
              disabled={loading}
              sx={{ minWidth: 150 }}
            >
              إضافة فلتر
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearIcon />}
          onClick={handleClear}
          disabled={localFilters.length === 0}
        >
          مسح الكل
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleApply}
            disabled={loading || localFilters.length === 0}
          >
            تطبيق الفلاتر
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedFilterModal;
