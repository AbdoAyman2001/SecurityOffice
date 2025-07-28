import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AttachFile as AttachIcon
} from '@mui/icons-material';
import { FORM_LABELS, MESSAGES } from '../../constants/russianLetterForm';
import { formatFileSize } from '../../utils/fileUtils';

const AttachmentsField = ({ 
  formData, 
  handleFiles, 
  removeAttachment 
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AttachIcon sx={{ mr: 1 }} />
        {FORM_LABELS.attachments}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {MESSAGES.attachmentsRequired}
      </Typography>
      
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={() => document.getElementById('file-input').click()}
        sx={{ mb: 2 }}
      >
        {MESSAGES.chooseFiles}
      </Button>
      
      {/* Hidden File Input */}
      <input
        id="file-input"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(Array.from(e.target.files))}
      />
      
      {/* Attached Files List */}
      {formData.attachments.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {MESSAGES.attachedFiles}
          </Typography>
          <List dense>
            {formData.attachments.map((file, index) => (
              <ListItem key={index} divider>
                <AttachIcon sx={{ mr: 1, color: 'primary.main' }} />
                <ListItemText
                  primary={file.name}
                  secondary={`الحجم: ${formatFileSize(file.size)}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => removeAttachment(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default AttachmentsField;
