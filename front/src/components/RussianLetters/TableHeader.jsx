import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TableHeader = ({ 
  totalCount, 
  filteredCount, 
  onRefresh, 
  loading,
  hasActiveFilters 
}) => {
  const navigate = useNavigate();
  const { canEditCorrespondence } = useAuth();

  const handleAddLetter = () => {
    navigate('/forms/russian-letter');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Title and Actions */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            الخطابات الروسية
          </Typography>
          
          {/* Statistics */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="textSecondary">
              إجمالي الخطابات:
            </Typography>
            <Chip 
              label={totalCount} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
            
            {hasActiveFilters && filteredCount !== totalCount && (
              <>
                <Typography variant="body2" color="textSecondary">
                  المفلترة:
                </Typography>
                <Chip 
                  label={filteredCount} 
                  size="small" 
                  color="secondary" 
                  variant="filled" 
                />
              </>
            )}
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="تحديث البيانات">
            <IconButton 
              color="primary" 
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="تصدير البيانات">
            <IconButton 
              color="secondary" 
              onClick={handleExport}
              disabled={loading}
            >
              <ExportIcon />
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
        </Box>
      </Box>
    </Box>
  );
};

export default TableHeader;
