import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';

const RelatedCorrespondenceList = ({ correspondence, onViewCorrespondence }) => {
  // Get direction icon and label
  const getDirectionInfo = (direction) => {
    switch (direction) {
      case 'Incoming':
        return { icon: <ArrowForwardIcon />, label: 'وارد', color: 'success' };
      case 'Outgoing':
        return { icon: <ArrowBackIcon />, label: 'صادر', color: 'primary' };
      case 'Internal':
        return { icon: <SwapHorizIcon />, label: 'داخلي', color: 'info' };
      default:
        return { icon: <SwapHorizIcon />, label: 'غير محدد', color: 'default' };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'normal': return 'primary';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'عالية';
      case 'normal': return 'عادية';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
    }
  };

  if (!correspondence || correspondence.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <SwapHorizIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          لا توجد خطابات ذات صلة
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {correspondence.map((item, index) => {
        const directionInfo = getDirectionInfo(item.direction);
        
        return (
          <ListItem
            key={item.correspondence_id || index}
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
            <Avatar
              sx={{ 
                mr: 2, 
                bgcolor: `${directionInfo.color}.light`,
                color: `${directionInfo.color}.contrastText`,
                width: 40,
                height: 40
              }}
            >
              {directionInfo.icon}
            </Avatar>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {item.subject || 'بدون موضوع'}
                  </Typography>
                  <Chip
                    label={directionInfo.label}
                    size="small"
                    color={directionInfo.color}
                    variant="outlined"
                  />
                  <Chip
                    label={getPriorityLabel(item.priority)}
                    size="small"
                    color={getPriorityColor(item.priority)}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    رقم المرجع: {item.reference_number || 'غير محدد'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    التاريخ: {formatDate(item.correspondence_date)}
                  </Typography>
                  {item.contact && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      {item.contact.contact_type === 'Person' ? 
                        <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} /> : 
                        <BusinessIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      }
                      <Typography variant="caption" color="text.secondary">
                        {item.contact.name}
                      </Typography>
                    </Box>
                  )}
                  {item.current_status && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      الحالة: {item.current_status.procedure_name}
                    </Typography>
                  )}
                </Box>
              }
            />
            
            <ListItemSecondaryAction>
              <Tooltip title="عرض تفاصيل الخطاب">
                <IconButton
                  edge="end"
                  onClick={() => onViewCorrespondence(item.correspondence_id)}
                  color="primary"
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        );
      })}
    </List>
  );
};

export default RelatedCorrespondenceList;
