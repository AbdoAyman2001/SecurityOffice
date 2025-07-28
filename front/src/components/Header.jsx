import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const { 
    user, 
    logout, 
    isAuthenticated, 
    getUserName, 
    getUserRoleDisplay,
    isAdmin,
    isNormalUser 
  } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleUserManagement = () => {
    handleMenuClose();
    navigate('/admin/users');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <SecurityIcon sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1, 
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 600,
          }}
        >
          نظام مكتب الأمان
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* User Role Chip */}
          <Chip
            label={getUserRoleDisplay()}
            color={isAdmin() ? 'secondary' : 'default'}
            variant="outlined"
            size="small"
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              '& .MuiChip-label': {
                fontFamily: 'Cairo, sans-serif',
              },
            }}
          />

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ 
                color: 'white',
                fontFamily: 'Cairo, sans-serif',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              مرحباً، {getUserName()}
            </Typography>
            
            <IconButton
              onClick={handleMenuOpen}
              sx={{ color: 'white' }}
            >
              <Avatar
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                }}
              >
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 8,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                '& .MuiMenuItem-root': {
                  fontFamily: 'Cairo, sans-serif',
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* User Info */}
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {getUserName()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.username} • {getUserRoleDisplay()}
              </Typography>
            </Box>
            
            <Divider />

            {/* Profile */}
            <MenuItem onClick={handleProfile}>
              <PersonIcon sx={{ mr: 1 }} />
              الملف الشخصي
            </MenuItem>

            {/* Admin Menu Items */}
            {isAdmin() && [
              // Using array instead of Fragment as per MUI requirements
              <MenuItem key="user-management" onClick={handleUserManagement}>
                <SettingsIcon sx={{ mr: 1 }} />
                إدارة المستخدمين
              </MenuItem>,
              <Divider key="admin-divider" />
            ]}

            {/* Logout */}
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1 }} />
              تسجيل الخروج
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
