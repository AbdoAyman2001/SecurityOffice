import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
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
          <CheckCircleIcon color="primary" />
          تاريخ الحالات
        </Typography>
        
        {statusHistory.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            لا يوجد تاريخ للحالات
          </Typography>
        ) : (
          <Timeline sx={{ p: 0 }}>
            {statusHistory.map((status, index) => (
              <TimelineItem key={status.id || index}>
                <TimelineSeparator>
                  <TimelineDot 
                    color={index === 0 ? "primary" : "grey"}
                    variant={index === 0 ? "filled" : "outlined"}
                  >
                    {index === 0 ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                  </TimelineDot>
                  {index < statusHistory.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" component="div">
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
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
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
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusHistory;
