import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Mail as MailIcon,
  Assignment as AssignmentIcon,
  DirectionsCar as CarIcon,
  CreditCard as CardIcon,
  ReportProblem as AccidentIcon,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={`${color}.main`}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 40, color: `${color}.main` } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    people: 0,
    correspondence: 0,
    permits: 0,
    vehicles: 0,
    cards: 0,
    accidents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch statistics from all endpoints
        const [
          peopleResponse,
          correspondenceResponse,
          permitsResponse,
          vehiclesResponse,
          cardsResponse,
          accidentsResponse,
        ] = await Promise.all([
          apiService.get('/people-history/'),
          apiService.get('/correspondence/'),
          apiService.get('/permits/'),
          apiService.get('/vehicles/'),
          apiService.get('/card-permits/'),
          apiService.get('/accidents/'),
        ]);

        setStats({
          people: peopleResponse.data.count || 0,
          correspondence: correspondenceResponse.data.count || 0,
          permits: permitsResponse.data.count || 0,
          vehicles: vehiclesResponse.data.count || 0,
          cards: cardsResponse.data.count || 0,
          accidents: accidentsResponse.data.count || 0,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        لوحة التحكم الرئيسية
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="إجمالي الأشخاص"
            value={stats.people}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="المراسلات"
            value={stats.correspondence}
            icon={<MailIcon />}
            color="secondary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="التصاريح"
            value={stats.permits}
            icon={<AssignmentIcon />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="المركبات"
            value={stats.vehicles}
            icon={<CarIcon />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="بطاقات الدخول"
            value={stats.cards}
            icon={<CardIcon />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="الحوادث"
            value={stats.accidents}
            icon={<AccidentIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            مرحباً بك في نظام إدارة أمن الموقع
          </Typography>
          <Typography variant="body1" color="textSecondary">
            يمكنك من خلال هذا النظام إدارة جميع جوانب الأمن في الموقع بما في ذلك:
          </Typography>
          <Box component="ul" sx={{ mt: 2, pr: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              إدارة بيانات الأشخاص والموظفين
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              متابعة المراسلات الواردة والصادرة
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              إصدار ومتابعة التصاريح الأمنية
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              إدارة المركبات وتصاريح الدخول
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              إدارة بطاقات الدخول والهوية
            </Typography>
            <Typography component="li" variant="body2">
              تسجيل ومتابعة الحوادث الأمنية
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
