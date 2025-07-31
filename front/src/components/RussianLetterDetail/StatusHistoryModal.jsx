import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Paper,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import {
  History as HistoryIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDateTime } from '../../utils/dateUtils';

const StatusHistoryModal = ({ open, onClose, statusHistory, letterTitle }) => {
  // Get status color based on status type
  const getStatusColor = (statusName) => {
    if (!statusName) return 'default';
    
    const lowerStatus = statusName.toLowerCase();
    if (lowerStatus.includes('مكتمل') || lowerStatus.includes('موافق')) return 'success';
    if (lowerStatus.includes('مرفوض') || lowerStatus.includes('ملغي')) return 'error';
    if (lowerStatus.includes('قيد المراجعة') || lowerStatus.includes('معلق')) return 'warning';
    return 'primary';
  };

  // Get timeline dot icon based on status
  const getTimelineDotIcon = (statusName) => {
    if (!statusName) return <HistoryIcon />;
    
    const lowerStatus = statusName.toLowerCase();
    if (lowerStatus.includes('مكتمل')) return '✓';
    if (lowerStatus.includes('مرفوض')) return '✗';
    if (lowerStatus.includes('معلق')) return '⏸';
    return <HistoryIcon fontSize="small" />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              تاريخ تغيير الحالات
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {letterTitle}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {!statusHistory || !Array.isArray(statusHistory) || statusHistory.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              لا يوجد تاريخ للتغييرات
            </Typography>
            <Typography variant="body2" color="text.secondary">
              لم يتم تسجيل أي تغييرات على حالة هذا الخطاب بعد.
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {statusHistory.map((entry, index) => (
              <ListItem
                key={entry.id || index}
                alignItems="flex-start"
                sx={{
                  mb: 2,
                  p: 0,
                  flexDirection: 'column',
                  alignItems: 'stretch'
                }}
              >
                <Box sx={{ display: 'flex', width: '100%' }}>
                  <ListItemAvatar sx={{ minWidth: 56 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${getStatusColor(entry.to_status_name)}.main`,
                        width: 40,
                        height: 40,
                        fontSize: '14px'
                      }}
                    >
                      {getTimelineDotIcon(entry.to_status_name)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <Box sx={{ flex: 1, ml: 1 }}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        backgroundColor: index === 0 ? 'primary.light' : 'background.paper',
                        color: index === 0 ? 'primary.contrastText' : 'text.primary',
                        position: 'relative'
                      }}
                    >
                      {/* Status Change Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        {entry.form_status_name && (
                          <>
                            <Chip 
                              label={entry.form_status_name} 
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ 
                                backgroundColor: index === 0 ? 'rgba(255,255,255,0.2)' : 'default',
                                color: index === 0 ? 'inherit' : 'default'
                              }}
                            />
                            <ArrowForwardIcon sx={{ fontSize: 16 }} />
                          </>
                        )}
                        <Chip 
                          label={entry.to_status_name || 'حالة جديدة'} 
                          size="small"
                          color={index === 0 ? 'secondary' : getStatusColor(entry.to_status_name)}
                          variant={index === 0 ? 'filled' : 'outlined'}
                        />
                      </Box>

                      {/* Change Details */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                          {formatDateTime(entry.created_at)}
                        </Typography>
                        
                        {entry.changed_by && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2">
                              {entry.changed_by.full_name_arabic || entry.changed_by.username}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Change Reason */}
                      {entry.change_reason && (
                        <>
                          <Divider sx={{ my: 1, opacity: 0.5 }} />
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'medium', display: 'block', mb: 0.5 }}>
                              سبب التغيير:
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {entry.change_reason}
                            </Typography>
                          </Box>
                        </>
                      )}

                      {/* Current Status Indicator */}
                      {index === 0 && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            الحالة الحالية
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
                
                {/* Connection Line */}
                {index < statusHistory.length - 1 && (
                  <Box
                    sx={{
                      width: 2,
                      height: 20,
                      backgroundColor: 'divider',
                      ml: '27px',
                      mt: 1
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose}
          startIcon={<CloseIcon />}
          variant="outlined"
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusHistoryModal;
