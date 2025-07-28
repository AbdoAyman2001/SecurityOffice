import React, { useState, useEffect } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';


const InlineEditCell = ({
  value,
  type = 'text',
  options = [],
  onSave,
  onCancel,
  editable = true,
  displayValue,
  fieldName,
  rowId,
  maxWidth = 200,
  multiline = false,
  required = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    if (editable) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleSave = async () => {
    if (required && (!editValue || editValue === '')) {
      return;
    }

    setLoading(true);
    try {
      const result = await onSave(rowId, fieldName, editValue);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !multiline) {
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const renderDisplayValue = () => {
    if (displayValue) {
      return displayValue;
    }

    switch (type) {
      case 'priority':
        const priorityMap = {
          high: { label: 'عالية', color: 'error' },
          normal: { label: 'عادية', color: 'default' },
          low: { label: 'منخفضة', color: 'info' }
        };
        const priority = priorityMap[value] || priorityMap.normal;
        return (
          <Chip
            label={priority.label}
            color={priority.color}
            size="small"
            variant={value === 'high' ? 'filled' : 'outlined'}
          />
        );
      
      case 'date':
        if (!value) return 'غير محدد';
        try {
          return new Date(value).toLocaleDateString('ar-EG');
        } catch {
          return value;
        }
      
      case 'select':
        const option = options.find(opt => opt.value === value);
        return option ? option.label : value || 'غير محدد';
      
      default:
        return value || 'غير محدد';
    }
  };

  const renderEditControl = () => {
    switch (type) {
      case 'select':
      case 'priority':
        return (
          <FormControl fullWidth size="small">
            <Select
              value={editValue || ''}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'date':
        return (
          <TextField
            fullWidth
            size="small"
            type="date"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            InputLabelProps={{
              shrink: true,
            }}
            autoFocus
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            size="small"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            multiline={multiline}
            rows={multiline ? 2 : 1}
            autoFocus
            required={required}
          />
        );
    }
  };

  if (!isEditing) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          maxWidth,
          cursor: editable ? 'pointer' : 'default'
        }}
        onClick={handleStartEdit}
      >
        <Box
          component={type === 'priority' ? 'div' : 'p'}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: multiline ? 'normal' : 'nowrap',
            flex: 1,
            margin: 0,
            fontSize: '0.875rem',
            lineHeight: 1.43,
            letterSpacing: '0.01071em'
          }}
        >
          {renderDisplayValue()}
        </Box>
        {editable && (
          <Tooltip title="تعديل">
            <IconButton size="small" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth }}>
      <Box sx={{ flex: 1 }}>
        {renderEditControl()}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="حفظ">
          <IconButton 
            size="small" 
            color="primary" 
            onClick={handleSave}
            disabled={loading || (required && (!editValue || editValue === ''))}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="إلغاء">
          <IconButton 
            size="small" 
            color="secondary" 
            onClick={handleCancel}
            disabled={loading}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default InlineEditCell;
