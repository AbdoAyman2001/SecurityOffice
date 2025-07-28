import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Divider,
  Alert,
  Typography,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon
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

  // Predefined filters
  const predefinedFilters = [
    {
      id: 'initial_state',
      name: 'الخطابات في الحالة الأولية',
      description: 'الخطابات التي لم يتم معالجتها بعد',
      icon: <SpeedIcon />,
      color: 'warning',
      filters: [
        {
          id: Date.now() + 1,
          field: 'current_status',
          operator: 'equals',
          value: 'initial',
          logic: null
        }
      ]
    },
    {
      id: 'final_state',
      name: 'الخطابات في الحالة النهائية',
      description: 'الخطابات المكتملة والمنجزة',
      icon: <CheckCircleIcon />,
      color: 'success',
      filters: [
        {
          id: Date.now() + 2,
          field: 'current_status',
          operator: 'equals',
          value: 'completed',
          logic: null
        }
      ]
    },
    {
      id: 'high_priority_unassigned',
      name: 'عالية الأولوية غير مخصصة',
      description: 'الخطابات عالية الأولوية التي لم يتم تخصيصها لأحد',
      icon: <FilterIcon />,
      color: 'error',
      filters: [
        {
          id: Date.now() + 3,
          field: 'priority',
          operator: 'equals',
          value: 'high',
          logic: null
        },
        {
          id: Date.now() + 4,
          field: 'assigned_to',
          operator: 'is_empty',
          value: '',
          logic: 'AND'
        }
      ]
    }
  ];

  // Filter operators
  const operators = {
    text: [
      { value: 'contains', label: 'يحتوي على' },
      { value: 'equals', label: 'يساوي' },
      { value: 'starts_with', label: 'يبدأ بـ' },
      { value: 'ends_with', label: 'ينتهي بـ' },
      { value: 'not_contains', label: 'لا يحتوي على' },
      { value: 'is_empty', label: 'فارغ' },
      { value: 'is_not_empty', label: 'غير فارغ' }
    ],
    select: [
      { value: 'equals', label: 'يساوي' },
      { value: 'not_equals', label: 'لا يساوي' },
      { value: 'in', label: 'ضمن' },
      { value: 'not_in', label: 'ليس ضمن' },
      { value: 'is_empty', label: 'فارغ' },
      { value: 'is_not_empty', label: 'غير فارغ' }
    ],
    date: [
      { value: 'equals', label: 'يساوي' },
      { value: 'before', label: 'قبل' },
      { value: 'after', label: 'بعد' },
      { value: 'between', label: 'بين' },
      { value: 'last_days', label: 'آخر ... أيام' },
      { value: 'this_month', label: 'هذا الشهر' },
      { value: 'last_month', label: 'الشهر الماضي' },
      { value: 'this_year', label: 'هذا العام' }
    ],
    priority: [
      { value: 'equals', label: 'يساوي' },
      { value: 'not_equals', label: 'لا يساوي' },
      { value: 'in', label: 'ضمن' }
    ]
  };

  // Field definitions
  const fields = [
    { 
      id: 'reference_number', 
      label: 'الرقم المرجعي', 
      type: 'text',
      operators: operators.text
    },
    { 
      id: 'subject', 
      label: 'الموضوع', 
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
      id: 'type', 
      label: 'النوع', 
      type: 'select',
      operators: operators.select,
      options: correspondenceTypes.map(type => ({
        value: type.type_id,
        label: type.type_name
      }))
    },
    { 
      id: 'priority', 
      label: 'الأولوية', 
      type: 'select',
      operators: operators.priority,
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
      id: 'assigned_to', 
      label: 'المخصص إلى', 
      type: 'select',
      operators: operators.select,
      options: [
        { value: null, label: 'غير مخصص' },
        ...users.map(user => ({
          value: user.person_record_id,
          label: user.full_name_arabic || user.full_name_english || user.person_record_id
        }))
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
            correspondenceTypesApi.getAll({ category: 'Russian' }),
            peopleApi.getAll()
          ]);
          
          setCorrespondenceTypes(typesResponse.data.results || typesResponse.data || []);
          setUsers(usersResponse.data.results || usersResponse.data || []);
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
      logic: localFilters.length > 0 ? 'AND' : null
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
    // Validate filters
    const validFilters = localFilters.filter(f => 
      f.field && f.operator && (f.value !== '' || ['is_empty', 'is_not_empty', 'this_month', 'last_month', 'this_year'].includes(f.operator))
    );
    
    onFiltersChange(validFilters);
    onApply(validFilters);
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
    if (!fieldConfig) return null;

    // No value input needed for these operators
    if (['is_empty', 'is_not_empty', 'this_month', 'last_month', 'this_year'].includes(filter.operator)) {
      return null;
    }

    switch (fieldConfig.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            size="small"
            placeholder="القيمة"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          />
        );
      
      case 'date':
        if (filter.operator === 'between') {
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                type="date"
                value={filter.value?.from || ''}
                onChange={(e) => updateFilter(filter.id, { 
                  value: { ...filter.value, from: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                value={filter.value?.to || ''}
                onChange={(e) => updateFilter(filter.id, { 
                  value: { ...filter.value, to: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          );
        } else if (filter.operator === 'last_days') {
          return (
            <TextField
              size="small"
              type="number"
              placeholder="عدد الأيام"
              value={filter.value || ''}
              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            />
          );
        } else {
          return (
            <TextField
              size="small"
              type="date"
              value={filter.value || ''}
              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          );
        }
      
      case 'select':
        if (['in', 'not_in'].includes(filter.operator)) {
          return (
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={filter.value || []}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const option = fieldConfig.options.find(opt => opt.value === value);
                      return (
                        <Chip
                          key={value}
                          label={option?.label || value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {fieldConfig.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        } else {
          return (
            <FormControl fullWidth size="small">
              <Select
                value={filter.value || ''}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
              >
                {fieldConfig.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
      
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          <Typography variant="h6">
            الفلاتر المتقدمة
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip 
              label={activeFiltersCount} 
              size="small" 
              color="primary" 
            />
          )}
        </Box>
        
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Predefined Filters */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            فلاتر سريعة
          </Typography>
          <Grid container spacing={2}>
            {predefinedFilters.map((predefined) => (
              <Grid item xs={12} sm={6} md={4} key={predefined.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={() => applyPredefinedFilter(predefined)}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
                      <Box sx={{ color: `${predefined.color}.main` }} mb={0}>
                        {predefined.icon}
                      </Box>
                      <Typography variant="subtitle2" fontWeight="bold" mb={0}>
                        {predefined.name}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    <Button 
                      size="small" 
                      color={predefined.color}
                      startIcon={<SearchIcon />}
                      mb={0}
                    >
                      تطبيق
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Custom Filters */}
        <Box>
          <Typography variant="h6" gutterBottom>
            فلاتر مخصصة
          </Typography>
          
          {localFilters.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              لا توجد فلاتر مطبقة. اضغط "إضافة فلتر" لبدء الفلترة المتقدمة أو استخدم الفلاتر السريعة أعلاه.
            </Alert>
          ) : (
            <Box sx={{ mb: 2 }}>
              {localFilters.map((filter, index) => (
                <Box key={filter.id} sx={{ mb: 2 }}>
                  {/* Logic operator for subsequent filters */}
                  {index > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <Select
                          value={filter.logic || 'AND'}
                          onChange={(e) => updateFilter(filter.id, { logic: e.target.value })}
                        >
                          <MenuItem value="AND">و</MenuItem>
                          <MenuItem value="OR">أو</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                  
                  {/* Filter row */}
                  <Grid container spacing={2} alignItems="center">
                    {/* Field */}
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
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
                    </Grid>

                    {/* Operator */}
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
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
                    </Grid>

                    {/* Value */}
                    <Grid item xs={12} sm={5}>
                      {renderValueInput(filter)}
                    </Grid>

                    {/* Remove button */}
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        color="error"
                        onClick={() => removeFilter(filter.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addFilter}
            disabled={loading}
          >
            إضافة فلتر
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            disabled={localFilters.length === 0}
          >
            مسح الكل
          </Button>
          
          <Stack direction="row" spacing={1}>
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
              disabled={loading}
            >
              تطبيق الفلاتر
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedFilterModal;
