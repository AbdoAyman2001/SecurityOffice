import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Mail as MailIcon,
  Assignment as AssignmentIcon,
  DirectionsCar as CarIcon,
  CreditCard as CardIcon,
  ReportProblem as AccidentIcon,
  Home as RelocationIcon,
  Description as FormIcon,
  Assignment as PermitFormIcon,
  PersonAdd as PersonFormIcon,
  Settings as SettingsIcon,
  Tune as ConfigIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  {
    text: 'لوحة التحكم',
    icon: <DashboardIcon />,
    path: '/',
  },
  {
    text: 'إدارة الأشخاص',
    icon: <PeopleIcon />,
    path: '/people',
  },
  {
    text: 'إدارة المراسلات',
    icon: <MailIcon />,
    path: '/correspondence',
  },
  {
    text: 'إدارة التصاريح',
    icon: <AssignmentIcon />,
    path: '/permits',
  },
  {
    text: 'إدارة المركبات',
    icon: <CarIcon />,
    path: '/vehicles',
  },
  {
    text: 'بطاقات الدخول',
    icon: <CardIcon />,
    path: '/cards',
  },
  {
    text: 'الحوادث',
    icon: <AccidentIcon />,
    path: '/accidents',
  },
  {
    text: 'النقل والإسكان',
    icon: <RelocationIcon />,
    path: '/relocation',
  },
];

const formsMenuItems = [
  {
    text: 'نموذج إضافة مراسلة',
    icon: <MailIcon />,
    path: '/forms/letter',
  },
  {
    text: 'نموذج طلب تصريح',
    icon: <PermitFormIcon />,
    path: '/forms/permit-request',
  },
  {
    text: 'نموذج إضافة شخص',
    icon: <PersonFormIcon />,
    path: '/forms/person-form',
  },
  {
    text: 'نموذج تسجيل حادث',
    icon: <AccidentIcon />,
    path: '/forms/accident-form',
  },
];

const adminMenuItems = [
  {
    text: 'إعدادات النظام',
    icon: <SettingsIcon />,
    path: '/settings',
  },
  {
    text: 'إعدادات المراسلات',
    icon: <ConfigIcon />,
    path: '/correspondence-config',
  },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const drawer = (
    <Box >
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* Forms Section */}
      <Box sx={{ p: 2, backgroundColor: 'rgba(25, 118, 210, 0.05)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
          <FormIcon sx={{ mr: 1, fontSize: 16 }} />
          النماذج
        </Typography>
      </Box>
      
      <List>
        {formsMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Admin Section - Only show for admin users */}
      {isAdmin() && (
        <>
          <Divider />
          <Box sx={{ p: 2, backgroundColor: 'rgba(220, 0, 78, 0.05)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
              <SettingsIcon sx={{ mr: 1, fontSize: 16 }} />
              إعدادات المدير
            </Typography>
          </Box>
          
          <List>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(220, 0, 78, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(220, 0, 78, 0.2)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'secondary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                        color: location.pathname === item.path ? 'secondary.main' : 'inherit',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          top: 64, // Below the navbar
          height: 'calc(100% - 64px)',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;