import React from 'react';
import {
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const ActionButtons = ({
  row,
  canView,
  canEdit,
  onViewItem,
  onEditItem
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
      {canView && onViewItem && (
        <Tooltip title="عرض التفاصيل">
          <IconButton
            size="small"
            onClick={() => onViewItem(row)}
            sx={{
              color: 'primary.main',
              '&:hover': { backgroundColor: 'primary.light', color: 'white' }
            }}
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
            sx={{
              color: 'secondary.main',
              '&:hover': { backgroundColor: 'secondary.light', color: 'white' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ActionButtons;
