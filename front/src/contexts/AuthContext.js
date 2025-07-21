import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        const isValid = await authService.checkAuthStatus();
        
        if (isValid) {
          setUser(authService.getCurrentUser());
          setPermissions(authService.getUserPermissions());
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear auth state
          await logout();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password, rememberMe = false) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authService.login(username, password, rememberMe);
      
      setUser(response.user);
      setPermissions(response.permissions);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setPermissions({});
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authService.updateProfile(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      const response = await authService.changePassword(oldPassword, newPassword, confirmPassword);
      return response;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  const refreshPermissions = async () => {
    try {
      const newPermissions = await authService.getPermissions();
      setPermissions(newPermissions);
      return newPermissions;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  // Permission check methods
  const isAdmin = () => permissions.is_admin || false;
  const isNormalUser = () => permissions.is_normal_user || false;
  const canCreateCorrespondence = () => permissions.can_create_correspondence || false;
  const canEditCorrespondence = () => permissions.can_edit_correspondence || false;
  const canDeleteCorrespondence = () => permissions.can_delete_correspondence || false;
  const canManageUsers = () => permissions.can_manage_users || false;
  const canViewReports = () => permissions.can_view_reports || false;
  const canManagePermits = () => permissions.can_manage_permits || false;

  const getUserRole = () => user?.role || 'normal';
  const getUserRoleDisplay = () => user?.role_display || 'مستخدم عادي';
  const getUserName = () => user?.full_name_arabic || user?.first_name || user?.username || '';

  const clearError = () => setError(null);

  const value = {
    // State
    user,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    updateProfile,
    changePassword,
    refreshPermissions,
    clearError,
    
    // Permission checks
    isAdmin,
    isNormalUser,
    canCreateCorrespondence,
    canEditCorrespondence,
    canDeleteCorrespondence,
    canManageUsers,
    canViewReports,
    canManagePermits,
    
    // User info
    getUserRole,
    getUserRoleDisplay,
    getUserName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
