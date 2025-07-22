import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
} from "@mui/icons-material";

const Navbar = ({ onMenuClick, pageTitle }) => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated, getUserName, isAdmin } = useAuth();

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="فتح القائمة"
          onClick={onMenuClick}
          edge="start"
          sx={{ ml: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: "bold",
              fontSize: "1.5rem",
            }}
          >
            إدارة أمن الموقع
          </Typography>

          {pageTitle && (
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: "1rem",
                opacity: 0.9,
                fontWeight: "medium",
              }}
            >
              {pageTitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isAuthenticated && (
            <Typography
              variant="body1"
              sx={{ color: "white", fontWeight: "medium" }}
            >
              {getUserName ? getUserName() : user?.username}
            </Typography>
          )}

          {/* Logout Button */}
          {isAuthenticated && (
            <IconButton
              size="large"
              aria-label="تسجيل الخروج"
              onClick={handleLogout}
              color="inherit"
              title="تسجيل الخروج"
            >
              <Logout />
            </IconButton>
          )}
          
          {/* Account Icon (Static) */}
          <IconButton
            size="large"
            aria-label="حساب المستخدم الحالي"
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          
          {/* Settings Button - Only for Admin */}
          {isAdmin && isAdmin() && (
            <IconButton
              size="large"
              aria-label="الإعدادات"
              onClick={handleSettings}
              color="inherit"
              title="الإعدادات"
            >
              <Settings />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
