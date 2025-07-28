import React from 'react';
import {
  Chip,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import InlineEditCell from '../RussianLetters/InlineEditCell';
import HighlightedText from './HighlightedText';

const CellRenderer = ({
  row,
  column,
  enableInlineEdit,
  canEdit,
  onUpdateItem,
  customCellRenderers,
  searchTerm = ''
}) => {
  // Get cell value with fallback
  const getCellValue = (row, column) => {
    if (column.getValue && typeof column.getValue === 'function') {
      try {
        return column.getValue(row);
      } catch (error) {
        console.warn(`Error getting value for column ${column.id}:`, error);
        return column.defaultValue || 'خطأ';
      }
    }
    
    // Fallback to direct property access
    const value = row[column.id];
    return value !== null && value !== undefined ? value : column.defaultValue || 'غير محدد';
  };

  const value = getCellValue(row, column);

  // Check for custom renderer first
  if (customCellRenderers[column.id]) {
    return customCellRenderers[column.id](value, row, column);
  }

  // Handle different column types
  switch (column.type) {
    case 'priority':
      const priorityColors = {
        high: 'error',
        normal: 'default',
        low: 'success'
      };
      const priorityLabels = {
        high: 'عالية',
        normal: 'عادية',
        low: 'منخفضة'
      };
      const priorityDisplayLabel = priorityLabels[value] || value;
      return (
        <Chip
          label={priorityDisplayLabel}
          color={priorityColors[value] || 'default'}
          size="small"
          variant="outlined"
          sx={{
            // Highlight chip if search term matches
            ...(searchTerm && priorityDisplayLabel.toLowerCase().includes(searchTerm.toLowerCase()) && {
              backgroundColor: 'primary.light',
              fontWeight: 'bold',
              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.3)'
            })
          }}
        />
      );

    case 'direction':
      const directionColors = {
        Incoming: 'primary',
        Outgoing: 'secondary',
        Internal: 'default'
      };
      const directionLabels = {
        Incoming: 'وارد',
        Outgoing: 'صادر',
        Internal: 'داخلي'
      };
      const directionDisplayLabel = directionLabels[value] || value;
      return (
        <Chip
          label={directionDisplayLabel}
          color={directionColors[value] || 'default'}
          size="small"
          sx={{
            // Highlight chip if search term matches
            ...(searchTerm && directionDisplayLabel.toLowerCase().includes(searchTerm.toLowerCase()) && {
              backgroundColor: 'primary.light',
              fontWeight: 'bold',
              boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.3)'
            })
          }}
        />
      );

    case 'attachments':
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return (
          <Typography variant="body2" color="textSecondary">
            لا توجد مرفقات
          </Typography>
        );
      }
      const attachmentCount = Array.isArray(value) ? value.length : 1;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AttachFileIcon fontSize="small" color="primary" />
          <Typography variant="body2">
            {attachmentCount} مرفق
          </Typography>
        </Box>
      );

    case 'status_logs':
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return (
          <Typography variant="body2" color="textSecondary">
            لا يوجد سجل
          </Typography>
        );
      }
      const logCount = Array.isArray(value) ? value.length : 1;
      return (
        <Tooltip title="عرض سجل الحالات">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
            <HistoryIcon fontSize="small" color="primary" />
            <Typography variant="body2">
              {logCount} حالة
            </Typography>
          </Box>
        </Tooltip>
      );

    case 'parent_correspondence':
      if (!value || value === 'لا يوجد') {
        return (
          <Typography variant="body2" color="textSecondary">
            لا يوجد
          </Typography>
        );
      }
      return (
        <HighlightedText
          text={value}
          searchTerm={searchTerm}
          variant="body2"
          sx={{ color: 'primary.main', cursor: 'pointer' }}
        />
      );

    case 'date':
    case 'datetime':
      if (!value) {
        return (
          <Typography variant="body2" color="textSecondary">
            غير محدد
          </Typography>
        );
      }
      
      try {
        const date = new Date(value);
        const formattedDate = column.type === 'datetime' 
          ? date.toLocaleString('ar-EG')
          : date.toLocaleDateString('ar-EG');
        return (
          <Typography variant="body2">
            {formattedDate}
          </Typography>
        );
      } catch (error) {
        return (
          <Typography variant="body2">
            {value}
          </Typography>
        );
      }

    case 'number':
      return (
        <Typography variant="body2" align="right">
          {value?.toLocaleString?.('ar-EG') || value}
        </Typography>
      );

    case 'text':
    case 'select':
    default:
      // Handle inline editing for editable columns
      if (enableInlineEdit && column.editable && canEdit) {
        return (
          <InlineEditCell
            value={value}
            column={column}
            row={row}
            onUpdate={onUpdateItem}
          />
        );
      }

      // Handle multiline text
      if (column.multiline && value && value.length > 50) {
        return (
          <Tooltip title={value}>
            <HighlightedText
              text={value}
              searchTerm={searchTerm}
              variant="body2"
              sx={{
                maxWidth: column.width || 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'help'
              }}
            />
          </Tooltip>
        );
      }

      return (
        <HighlightedText
          text={value}
          searchTerm={searchTerm}
          variant="body2"
        />
      );
  }
};

export default CellRenderer;
