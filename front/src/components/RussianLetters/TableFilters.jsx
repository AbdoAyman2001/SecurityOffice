import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

import { correspondenceTypesApi, peopleApi } from '../../services/apiService';

const TableFilters = ({ 
  searchTerm, 
  onSearch, 
  filters, 
  onFilter, 
  onClearFilters 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    priority: '',
    type: '',
    assigned_to: '',
    date_from: null,
    date_to: null,
    ...filters
  });

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [typesResponse, usersResponse] = await Promise.all([
          correspondenceTypesApi.getAll({ category: 'Russian' }),
          peopleApi.getCurrentOnly()
        ]);
        
        setCorrespondenceTypes(typesResponse.data.results || typesResponse.data || []);
        setUsers(usersResponse.data.results || usersResponse.data || []);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    
    // Remove empty values before applying filters
    const cleanFilters = Object.entries(newFilters).reduce((acc, [key, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        acc[key] = val;
      }
      return acc;
    }, {});
    
    onFilter(cleanFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      priority: '',
      type: '',
      assigned_to: '',
      date_from: null,
      date_to: null
    });
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== '' && value !== null && value !== undefined
    ).length;
  };

  const priorityOptions = [
    { value: 'high', label: 'عالية' },
    { value: 'normal', label: 'عادية' },
    { value: 'low', label: 'منخفضة' }
  ];

  return (
    <Box sx={{ mb: 2 }}>
      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="البحث في الخطابات..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <Button
                size="small"
                onClick={() => onSearch('')}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <ClearIcon fontSize="small" />
              </Button>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {/* Advanced Filters */}
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography>فلاتر متقدمة</Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip 
                label={getActiveFiltersCount()} 
                size="small" 
                color="primary" 
              />
            )}
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Priority Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>الأولوية</InputLabel>
                <Select
                  value={localFilters.priority}
                  label="الأولوية"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Type Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>النوع</InputLabel>
                <Select
                  value={localFilters.type}
                  label="النوع"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  {correspondenceTypes.map((type) => (
                    <MenuItem key={type.type_id} value={type.type_id}>
                      {type.type_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Assigned User Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>المخصص إلى</InputLabel>
                <Select
                  value={localFilters.assigned_to}
                  label="المخصص إلى"
                  onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  <MenuItem value="null">غير مخصص</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.person_record_id} value={user.person_record_id}>
                      {user.full_name_arabic || user.full_name_english || user.person_record_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range Filters */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="من تاريخ"
                type="date"
                value={localFilters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="إلى تاريخ"
                type="date"
                value={localFilters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Clear Filters Button */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={getActiveFiltersCount() === 0}
              >
                مسح الفلاتر
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default TableFilters;
