import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { correspondenceApi } from '../../services/apiService';

const StatusHistory = ({ letterId }) => {
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      try {
        setLoading(true);
        const response = await correspondenceApi.getStatusHistory(letterId);
        setStatusHistory(response.data || []);
      } catch (err) {
        console.error('Error fetching status history:', err);
        setError('حدث خطأ أثناء تحميل تاريخ الحالات.');
      } finally {
        setLoading(false);
      }
    };

    if (letterId) {
      fetchStatusHistory();
    }
  }, [letterId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            تاريخ الحالات
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            تاريخ الحالات
          </Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          تاريخ الحالات
        </Typography>
        
        {statusHistory.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            لا يوجد تاريخ للحالات
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {statusHistory.map((status, index) => (
              <ListItem 
                key={status.id || index}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: index === 0 ? 'action.hover' : 'transparent'
                }}
              >
                <ListItemIcon>
                  {index === 0 ? (
                    <CheckCircleIcon color="primary" />
                  ) : (
                    <RadioButtonUncheckedIcon color="action" />
                  )}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                        {status.form_status_name && status.to_status_name ? (
                          <>
                            <span style={{ color: '#d32f2f' }}>{status.form_status_name}</span>
                            {' ← '}
                            <span style={{ color: '#2e7d32' }}>{status.to_status_name}</span>
                          </>
                        ) : (
                          status.to_status_name || 'تغيير الحالة'
                        )}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {status.changed_by?.username || status.changed_by?.full_name_arabic || 'النظام'}
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(status.created_at)}
                      </Typography>
                      
                      {status.change_reason && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            "{status.change_reason}"
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusHistory;
