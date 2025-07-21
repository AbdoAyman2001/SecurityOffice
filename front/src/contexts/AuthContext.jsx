import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

// Create the auth context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const isAuthenticated = await authService.checkAuthStatus();
        if (isAuthenticated) {
          setUser(authService.getCurrentUser());
          setPermissions(authService.getUserPermissions());
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Authentication check failed:", err);
        // Not setting error here as this is just a check
        localStorage.removeItem("authToken");
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("authToken");
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = async (username, password, rememberMe = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await authService.login(username, password, rememberMe);
      
      // authService already stores the token and user data
      setUser(authService.getCurrentUser());
      setPermissions(authService.getUserPermissions());
      setIsAuthenticated(true);
      
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        typeof err === 'string' ? err : 
        (err.message || "Login failed. Please check your credentials.")
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setPermissions([]);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permissionName) => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.includes(permissionName);
  };

  // Clear any authentication errors
  const clearError = () => {
    setError(null);
  };

  // Utility methods to simplify usage in components
  const isAdmin = () => authService.isAdmin();
  const isNormalUser = () => authService.isNormalUser();
  const canCreateCorrespondence = () => authService.canCreateCorrespondence();
  const canEditCorrespondence = () => authService.canEditCorrespondence();
  const canDeleteCorrespondence = () => authService.canDeleteCorrespondence();
  const canManageUsers = () => authService.canManageUsers();
  const canViewReports = () => authService.canViewReports();
  const canManagePermits = () => authService.canManagePermits();
  const getUserName = () => user?.username || 'غير معروف';
  const getUserRoleDisplay = () => {
    if (!user) return 'غير مسجل';
    if (isAdmin()) return 'مدير النظام';
    if (isNormalUser()) return 'مستخدم';
    return 'مستخدم';
  };

  const value = {
    user,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
    clearError,
    // Utility methods
    isAdmin,
    isNormalUser,
    canCreateCorrespondence,
    canEditCorrespondence,
    canDeleteCorrespondence,
    canManageUsers,
    canViewReports,
    canManagePermits,
    getUserName,
    getUserRoleDisplay
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
