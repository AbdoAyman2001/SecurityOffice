import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  Box,
  Tooltip
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

const ColumnVisibilityControl = ({ 
  columns, 
  visibleColumns, 
  onColumnVisibilityChange,
  storageKey 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColumnToggle = (columnId) => {
    const newVisibleColumns = { ...visibleColumns };
    newVisibleColumns[columnId] = !newVisibleColumns[columnId];
    
    // Save to localStorage
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newVisibleColumns));
    }
    
    onColumnVisibilityChange(newVisibleColumns);
  };

  const handleShowAll = () => {
    const newVisibleColumns = {};
    columns.forEach(column => {
      newVisibleColumns[column.id] = true;
    });
    
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newVisibleColumns));
    }
    
    onColumnVisibilityChange(newVisibleColumns);
  };

  const handleHideAll = () => {
    const newVisibleColumns = {};
    columns.forEach(column => {
      // Keep at least one column visible (usually the primary key)
      newVisibleColumns[column.id] = column.primaryKey || false;
    });
    
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newVisibleColumns));
    }
    
    onColumnVisibilityChange(newVisibleColumns);
  };

  const handleResetToDefault = () => {
    const newVisibleColumns = {};
    columns.forEach(column => {
      newVisibleColumns[column.id] = column.visible !== false; // Default to true unless explicitly false
    });
    
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newVisibleColumns));
    }
    
    onColumnVisibilityChange(newVisibleColumns);
  };

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const totalCount = columns.length;

  return (
    <>
      <Tooltip title="إدارة الأعمدة">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <ViewColumnIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 280,
            '& .MuiMenuItem-root': {
              padding: '4px 8px',
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            إدارة الأعمدة
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {visibleCount} من {totalCount} أعمدة مرئية
          </Typography>
        </Box>
        
        <Divider />
        
        {/* Control buttons */}
        <MenuItem onClick={handleShowAll} sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">
            إظهار الكل
          </Typography>
        </MenuItem>
        
        <MenuItem onClick={handleHideAll} sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">
            إخفاء الكل
          </Typography>
        </MenuItem>
        
        <MenuItem onClick={handleResetToDefault} sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">
            إعادة تعيين افتراضي
          </Typography>
        </MenuItem>
        
        <Divider />
        
        {/* Column list */}
        {columns.map((column) => (
          <MenuItem
            key={column.id}
            onClick={() => handleColumnToggle(column.id)}
            dense
            sx={{ 
              '&:hover': { backgroundColor: 'action.hover' },
              minHeight: 'auto'
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={visibleColumns[column.id] || false}
                  size="small"
                  sx={{ padding: '2px' }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {column.label}
                </Typography>
              }
              sx={{ 
                margin: 0, 
                width: '100%',
                '& .MuiFormControlLabel-label': {
                  flex: 1,
                  textAlign: 'right'
                }
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ColumnVisibilityControl;