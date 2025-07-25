import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Popover,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { correspondenceApi } from '../../services/apiService';

const ColumnFilter = ({
  column,
  values = [], // This will be ignored, we'll fetch from API
  selectedValues = [],
  onFilter,
  onClear,
  label,
  apiEndpoint = 'correspondence', // Allow customization for different tables
  apiService = correspondenceApi // Allow different API services
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedValues, setLocalSelectedValues] = useState(selectedValues);
  const [allValues, setAllValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);

  const open = Boolean(anchorEl);
  const hasActiveFilter = selectedValues.length > 0;

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedValues(selectedValues);
  }, [selectedValues]);

  // Fetch all possible values from backend when filter opens
  const fetchAllValues = async () => {
    if (allValues.length > 0) return; // Already fetched
    
    setLoading(true);
    try {
      // Fetch all data to get unique values for this column
      const response = await apiService.getAll({
        page_size: 1000, // Get a large number to capture all unique values
        direction: 'Incoming' // For Russian letters
      });
      
      const data = response.data.results || response.data || [];
      const uniqueValues = new Set();
      
      data.forEach(item => {
        let value = getNestedValue(item, column);
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value);
        }
      });
      
      // If we didn't get enough unique values, fetch more pages
      if (response.data.next && uniqueValues.size < 50) {
        let nextUrl = response.data.next;
        let pageCount = 1;
        
        while (nextUrl && pageCount < 5) { // Limit to 5 pages to avoid infinite loops
          try {
            const nextResponse = await fetch(nextUrl, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            const nextData = await nextResponse.json();
            
            (nextData.results || []).forEach(item => {
              let value = getNestedValue(item, column);
              if (value !== null && value !== undefined && value !== '') {
                uniqueValues.add(value);
              }
            });
            
            nextUrl = nextData.next;
            pageCount++;
          } catch (error) {
            console.warn('Error fetching additional pages for filter values:', error);
            break;
          }
        }
      }
      
      setAllValues(Array.from(uniqueValues).sort());
    } catch (error) {
      console.error('Error fetching filter values:', error);
      // Fallback to provided values if API fails
      setAllValues(values);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get nested values from objects
  const getNestedValue = (obj, column) => {
    // Handle special cases based on column name
    switch (column) {
      case 'type':
        return obj.type_name || obj.type?.type_name;
      case 'contact':
        return obj.contact_name || obj.contact?.name;
      case 'current_status':
        return obj.current_status_name || obj.current_status?.procedure_name;
      case 'assigned_to':
        return obj.assigned_to?.full_name_arabic || obj.assigned_to?.username;
      case 'priority':
        return obj.priority;
      case 'correspondence_date':
        return obj.correspondence_date;
      case 'reference_number':
        return obj.reference_number;
      case 'subject':
        return obj.subject;
      case 'direction':
        return obj.direction;
      default:
        // Handle nested object access
        const keys = column.split('.');
        let value = obj;
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined || value === null) break;
        }
        return value;
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchAllValues(); // Fetch values when opening
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
  };

  const handleValueToggle = (value) => {
    const newSelected = localSelectedValues.includes(value)
      ? localSelectedValues.filter(v => v !== value)
      : [...localSelectedValues, value];
    
    setLocalSelectedValues(newSelected);
  };

  const handleSelectAll = () => {
    const filteredValues = getFilteredValues();
    setLocalSelectedValues(filteredValues);
  };

  const handleDeselectAll = () => {
    setLocalSelectedValues([]);
  };

  const handleApply = () => {
    onFilter(column, localSelectedValues);
    handleClose();
  };

  const handleClear = () => {
    setLocalSelectedValues([]);
    onClear(column);
    handleClose();
  };

  const getFilteredValues = () => {
    if (!searchTerm) return allValues;
    return allValues.filter(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredValues = getFilteredValues();

  return (
    <>
      <IconButton
        ref={buttonRef}
        size="small"
        onClick={handleClick}
        sx={{
          color: hasActiveFilter ? 'warning.main' : 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <FilterIcon fontSize="small" />
        {hasActiveFilter && (
          <Chip
            label={selectedValues.length}
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 20,
              height: 20,
              fontSize: '0.75rem',
              backgroundColor: 'warning.main',
              color: 'white'
            }}
          />
        )}
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 450,
            p: 2
          }
        }}
      >
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            تصفية {label}
          </Typography>
          
          <TextField
            fullWidth
            size="small"
            placeholder="البحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              disabled={filteredValues.length === 0 || loading}
            >
              تحديد الكل
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
              disabled={loading}
            >
              إلغاء التحديد
            </Button>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>جاري التحميل...</Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 250, overflow: 'auto', p: 0 }}>
              {filteredValues.length === 0 ? (
                <ListItem>
                  <Typography variant="body2" color="text.secondary">
                    {allValues.length === 0 ? 'لا توجد قيم متاحة' : 'لا توجد نتائج للبحث'}
                  </Typography>
                </ListItem>
              ) : (
                filteredValues.map((value, index) => (
                  <ListItem key={index} dense sx={{ p: 0 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={localSelectedValues.includes(value)}
                          onChange={() => handleValueToggle(value)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {value || 'غير محدد'}
                        </Typography>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={handleClear}
              startIcon={<ClearIcon />}
              color="error"
              disabled={loading}
            >
              مسح
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleApply}
              disabled={loading}
            >
              تطبيق
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default ColumnFilter;
