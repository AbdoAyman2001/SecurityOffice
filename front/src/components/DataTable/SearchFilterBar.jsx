import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Stack,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SearchFilterBar = ({
  searchTerm,
  onSearch,
  totalCount,
  filteredCount,
  isFiltered,
  onClearAllFilters,
  onRefresh,
  onToggleAdvancedFilters,
  loading,
  advancedFilters = [],
  columnFilters = {}
}) => {
  const navigate = useNavigate();
  const { canEditCorrespondence } = useAuth();

  const handleAddLetter = () => {
    navigate('/forms/russian-letter');
  };

  return (
    <Box sx={{ mb: 1 }}>
      {/* Title and Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h5" component="h5">
          الخطابات الروسية
        </Typography>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="تحديث البيانات">
            <IconButton 
              color="primary" 
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {canEditCorrespondence() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddLetter}
              disabled={loading}
            >
              خطاب جديد
            </Button>
          )}
        </Stack>
      </Box>

      {/* Search and Filter Controls */}
      <Stack spacing={2}>
        {/* Main Search Bar */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="البحث في جميع الحقول..."
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
                  <IconButton
                    size="small"
                    onClick={() => onSearch('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper'
              }
            }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={onToggleAdvancedFilters}
            sx={{ minWidth: 140, py: 2 }}
          >
            فلاتر متقدمة
          </Button>

          {isFiltered && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={onClearAllFilters}
            >
              مسح الكل
            </Button>
          )}
        </Box>

        {/* Active Filters Summary */}
        {isFiltered && (
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'action.hover', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Stack spacing={1}>
              {/* Filter Count and Results */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="textSecondary">
                  الفلاتر النشطة:
                </Typography>
                
                {/* Search Filter */}
                {searchTerm && (
                  <Chip
                    label={`البحث: "${searchTerm}"`}
                    size="small"
                    onDelete={() => onSearch('')}
                    color="primary"
                  />
                )}
                
                {/* Column Filters */}
                {Object.entries(columnFilters).map(([column, values]) => {
                  if (!values || values.length === 0) return null;
                  return (
                    <Chip
                      key={column}
                      label={`${column}: ${values.length} قيمة`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  );
                })}
                
                {/* Advanced Filters */}
                {advancedFilters.length > 0 && (
                  <Chip
                    label={`فلاتر متقدمة: ${advancedFilters.length}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Stack>
              
              {/* Results Summary */}
              <Typography variant="body2" color="textSecondary">
                عرض {filteredCount.toLocaleString()} من أصل {totalCount.toLocaleString()} خطاب
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default SearchFilterBar;
