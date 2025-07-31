import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Code as CodeIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { formatFileSize } from '../../utils/fileUtils';
import { formatDateTime } from '../../utils/dateUtils';

const AttachmentsList = ({ attachments, onDownload, onOpenFolder, letterId }) => {
  
  const handleOpenFolder = () => {
    if (onOpenFolder && letterId) {
      onOpenFolder(letterId);
    }
  };
  // Get file icon based on file type
  const getFileIcon = (fileName, mimeType) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const type = mimeType?.toLowerCase();

    if (type?.includes('pdf') || extension === 'pdf') {
      return <PdfIcon color="error" />;
    }
    if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return <ImageIcon color="primary" />;
    }
    if (type?.includes('word') || ['doc', 'docx'].includes(extension)) {
      return <DocIcon color="info" />;
    }
    if (type?.includes('excel') || type?.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) {
      return <ExcelIcon color="success" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <ArchiveIcon color="warning" />;
    }
    if (['js', 'html', 'css', 'json', 'xml', 'txt'].includes(extension)) {
      return <CodeIcon color="secondary" />;
    }
    
    return <AttachFileIcon color="action" />;
  };

  // Get file type label
  const getFileTypeLabel = (fileName, mimeType) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const type = mimeType?.toLowerCase();

    if (type?.includes('pdf') || extension === 'pdf') return 'PDF';
    if (type?.includes('image')) return 'صورة';
    if (type?.includes('word')) return 'Word';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return 'Excel';
    if (['zip', 'rar', '7z'].includes(extension)) return 'أرشيف';
    if (['txt'].includes(extension)) return 'نص';
    
    return extension?.toUpperCase() || 'ملف';
  };

  // Get file type color
  const getFileTypeColor = (fileName, mimeType) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const type = mimeType?.toLowerCase();

    if (type?.includes('pdf') || extension === 'pdf') return 'error';
    if (type?.includes('image')) return 'primary';
    if (type?.includes('word')) return 'info';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return 'success';
    if (['zip', 'rar', '7z'].includes(extension)) return 'warning';
    
    return 'default';
  };

  if (!attachments || attachments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          لا توجد مرفقات
        </Typography>
        {onOpenFolder && (
          <Tooltip title="فتح مجلد المرفقات">
            <IconButton onClick={handleOpenFolder} color="primary">
              <FolderIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with folder button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3">
          المرفقات ({attachments.length})
        </Typography>
        {onOpenFolder && (
          <Tooltip title="فتح مجلد المرفقات">
            <IconButton onClick={handleOpenFolder} color="primary" size="small">
              <FolderIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <List>
        {attachments.map((attachment, index) => (
        <ListItem
          key={attachment.attachment_id || index}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <ListItemIcon>
            {getFileIcon(attachment.file_name, attachment.file_type)}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {attachment.file_name}
                </Typography>
                <Chip
                  label={getFileTypeLabel(attachment.file_name, attachment.file_type)}
                  size="small"
                  color={getFileTypeColor(attachment.file_name, attachment.file_type)}
                  variant="outlined"
                />
              </Box>
            }
            secondary={
              <span style={{ marginTop: '4px', display: 'block' }}>
                الحجم: {formatFileSize(attachment.file_size)} • تم الرفع: {formatDateTime(attachment.uploaded_at)}
              </span>
            }
          />
          
          <ListItemSecondaryAction>
            <Tooltip title="تحميل المرفق">
              <IconButton
                edge="end"
                onClick={() => onDownload(attachment.attachment_id, attachment.file_name)}
                color="primary"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default AttachmentsList;
