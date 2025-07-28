import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Sortable procedure item component
 * Displays individual procedure with drag-and-drop functionality
 */
const SortableProcedureItem = ({ procedure, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: procedure.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box {...attributes} {...listeners} sx={{ mr: 1, cursor: 'grab' }}>
        <DragIcon color="action" />
      </Box>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1">
              {procedure.procedure_order}. {procedure.procedure_name}
            </Typography>
            {procedure.is_initial && (
              <Tooltip title="إجراء ابتدائي">
                <FlagIcon color="success" fontSize="small" />
              </Tooltip>
            )}
            {procedure.is_final && (
              <Tooltip title="إجراء نهائي">
                <CheckCircleIcon color="primary" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        }
        secondary={procedure.description}
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="edit"
          onClick={() => onEdit(procedure)}
          sx={{ mr: 1 }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(procedure.id)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default SortableProcedureItem;
