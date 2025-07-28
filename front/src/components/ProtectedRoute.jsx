import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requirePermission = null,
  fallbackPath = '/login' 
}) => {
  const { isAuthenticated, isLoading, user, permissions } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          جاري التحقق من صلاحيات المستخدم...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !permissions.is_admin) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 4,
        }}
      >
        <Typography variant="h4" color="error" textAlign="center">
          غير مصرح لك بالوصول
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          هذه الصفحة تتطلب صلاحيات إدارية
        </Typography>
      </Box>
    );
  }

  // Check specific permission requirement
  if (requirePermission && !permissions[requirePermission]) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 4,
        }}
      >
        <Typography variant="h4" color="error" textAlign="center">
          غير مصرح لك بالوصول
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          ليس لديك الصلاحية المطلوبة للوصول إلى هذه الصفحة
        </Typography>
      </Box>
    );
  }

  // Render children if all checks pass
  return children;
};

export default ProtectedRoute;
