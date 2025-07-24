import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { 
  correspondenceTypeProceduresApi, 
  correspondenceStatusLogsApi,
  correspondenceApi 
} from '../services/apiService';

const StatusSelector = ({ 
  correspondenceId, 
  correspondenceTypeId, 
  currentStatus, 
  onStatusChange,
  disabled = false,
  showHistory = true 
}) => {
  const { user } = useAuth();
  const [procedures, setProcedures] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [changeReason, setChangeReason] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Load procedures for the correspondence type
  useEffect(() => {
    if (correspondenceTypeId) {
      loadProcedures();
    }
  }, [correspondenceTypeId]);

  // Load status history if correspondence exists
  useEffect(() => {
    if (correspondenceId && showHistory) {
      loadStatusHistory();
    }
  }, [correspondenceId, showHistory]);

  const loadProcedures = async () => {
    try {
      setLoading(true);
      const response = await correspondenceTypeProceduresApi.getByType(correspondenceTypeId);
      const proceduresList = response.data.results || response.data;
      proceduresList.sort((a, b) => a.order - b.order);
      setProcedures(proceduresList);
    } catch (error) {
      console.error('Error loading procedures:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusHistory = async () => {
    try {
      const response = await correspondenceStatusLogsApi.getByCorrespondence(correspondenceId);
      const logs = response.data.results || response.data;
      setStatusLogs(logs);
    } catch (error) {
      console.error('Error loading status history:', error);
    }
  };

  const handleStatusChangeClick = (procedure) => {
    setSelectedStatus(procedure);
    setChangeReason('');
    setChangeDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus || !correspondenceId) return;

    try {
      setLoading(true);
      
      // Create status log entry
      const logData = {
        correspondence: correspondenceId,
        from_status: currentStatus?.id || null,
        to_status: selectedStatus.id,
        changed_by: user.id,
        change_reason: changeReason || null
      };

      await correspondenceStatusLogsApi.create(logData);

      // Update correspondence current status
      await correspondenceApi.update(correspondenceId, {
        current_status: selectedStatus.id
      });

      // Notify parent component
      if (onStatusChange) {
        onStatusChange(selectedStatus);
      }

      // Reload status history
      if (showHistory) {
        loadStatusHistory();
      }

      setChangeDialogOpen(false);
    } catch (error) {
      console.error('Error changing status:', error);
      alert('خطأ في تغيير الحالة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!currentStatus) return -1;
    return procedures.findIndex(p => p.id === currentStatus.id);
  };

  const getStatusColor = (procedure) => {
    if (procedure.is_initial_status) return 'success';
    if (procedure.is_final_status) return 'primary';
    return 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      {/* Current Status Display */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          الحالة الحالية
        </Typography>
        {currentStatus ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={currentStatus.procedure_name}
              color={getStatusColor(currentStatus)}
              icon={
                currentStatus.is_initial_status ? <FlagIcon /> :
                currentStatus.is_final_status ? <CheckCircleIcon /> : null
              }
            />
            {currentStatus.description && (
              <Tooltip title={currentStatus.description}>
                <CommentIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary">لم يتم تحديد الحالة</Typography>
        )}
      </Box>

      {/* Status Change Selector */}
      {!disabled && procedures.length > 0 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>تغيير الحالة</InputLabel>
          <Select
            value=""
            label="تغيير الحالة"
            onChange={(e) => {
              const procedure = procedures.find(p => p.id === e.target.value);
              if (procedure) {
                handleStatusChangeClick(procedure);
              }
            }}
            disabled={loading}
          >
            {procedures.map((procedure) => (
              <MenuItem 
                key={procedure.id} 
                value={procedure.id}
                disabled={currentStatus?.id === procedure.id}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography>
                    {procedure.order}. {procedure.procedure_name}
                  </Typography>
                  {procedure.is_initial_status && (
                    <FlagIcon color="success" fontSize="small" />
                  )}
                  {procedure.is_final_status && (
                    <CheckCircleIcon color="primary" fontSize="small" />
                  )}
                  {currentStatus?.id === procedure.id && (
                    <Chip size="small" label="الحالة الحالية" color="primary" />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Progress Stepper */}
      {procedures.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            تقدم الإجراءات
          </Typography>
          <Stepper activeStep={getCurrentStepIndex()} orientation="vertical">
            {procedures.map((procedure, index) => (
              <Step key={procedure.id} completed={getCurrentStepIndex() > index}>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {procedure.procedure_name}
                    </Typography>
                    {procedure.is_initial_status && (
                      <FlagIcon color="success" fontSize="small" />
                    )}
                    {procedure.is_final_status && (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    )}
                  </Box>
                </StepLabel>
                {procedure.description && (
                  <StepContent>
                    <Typography variant="caption" color="text.secondary">
                      {procedure.description}
                    </Typography>
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      {/* Status History Button */}
      {showHistory && statusLogs.length > 0 && (
        <Button
          variant="outlined"
          size="small"
          onClick={() => setHistoryDialogOpen(true)}
          startIcon={<TimeIcon />}
        >
          عرض تاريخ التغييرات ({statusLogs.length})
        </Button>
      )}

      {/* Status Change Confirmation Dialog */}
      <Dialog open={changeDialogOpen} onClose={() => setChangeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          تأكيد تغيير الحالة
        </DialogTitle>
        <DialogContent>
          {selectedStatus && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                سيتم تغيير حالة الخطاب إلى: <strong>{selectedStatus.procedure_name}</strong>
              </Alert>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="سبب التغيير (اختياري)"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="اكتب سبب تغيير الحالة..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeDialogOpen(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirmStatusChange} 
            variant="contained" 
            disabled={loading}
          >
            تأكيد التغيير
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          تاريخ تغييرات الحالة
        </DialogTitle>
        <DialogContent>
          <List>
            {statusLogs.map((log, index) => (
              <ListItem key={log.id} divider={index < statusLogs.length - 1}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="body2">
                        {log.from_status_name ? 
                          `${log.from_status_name} ← ${log.to_status_name}` : 
                          `تم تعيين الحالة: ${log.to_status_name}`
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        بواسطة: {log.changed_by_full_name || log.changed_by_username} • {formatDate(log.created_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={log.change_reason && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>السبب:</strong> {log.change_reason}
                    </Typography>
                  )}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatusSelector;
