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
        
        // First try to restore from localStorage directly
        const storedUser = JSON.parse(localStorage.getItem("user") || 'null');
        const storedPermissions = JSON.parse(localStorage.getItem("permissions") || '{}');
        const token = localStorage.getItem("authToken");
        
        if (storedUser && token) {
          // Set initial state from localStorage
          setUser(storedUser);
          setPermissions(storedPermissions);
          setIsAuthenticated(true);
          
          // Then verify with server in background
          try {
            await authService.checkAuthStatus();
            // Update with latest data from server
            setUser(authService.getCurrentUser());
            setPermissions(authService.getUserPermissions());
          } catch (verifyErr) {
            console.error("Token validation failed:", verifyErr);
            // We'll keep the user logged in with stored data
            // Server verification will happen on next API call
          }
        } else if (token) {
          // We have a token but no user data, try to restore from server
          const isAuthenticated = await authService.checkAuthStatus();
          if (isAuthenticated) {
            setUser(authService.getCurrentUser());
            setPermissions(authService.getUserPermissions());
            setIsAuthenticated(true);
          } else {
            // Clear invalid token
            localStorage.removeItem("authToken");
          }
        }
      } catch (err) {
        console.error("Authentication check failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username, password, rememberMe = false) => {
    try {
      console.log('AuthContext: Starting login process...', { username });
      setIsLoading(true);
      setError(null);
      
      const data = await authService.login(username, password, rememberMe);
      console.log('AuthContext: Login successful, data:', data);
      
      // authService already stores the token and user data
      const currentUser = authService.getCurrentUser();
      const userPermissions = authService.getUserPermissions();
      
      console.log('AuthContext: Setting user data:', { currentUser, userPermissions });
      
      setUser(currentUser);
      setPermissions(userPermissions);
      setIsAuthenticated(true);
      
      console.log('AuthContext: Login completed successfully');
      return true;
    } catch (err) {
      console.error("AuthContext: Login failed:", err);
      console.error("AuthContext: Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = "فشل في تسجيل الدخول";
      
      if (err.response?.status === 401) {
        errorMessage = "اسم المستخدم أو كلمة المرور غير صحيحة";
      } else if (err.response?.status === 403) {
        errorMessage = "لا يوجد لديك صلاحية للوصول إلى هذا النظام";
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = "فشل في الاتصال بالخادم. يرجى المحاولة لاحقاً";
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Force logout on failed login to clear any inconsistent state
      console.log('AuthContext: Login failed, forcing logout to clear state');
      await this.forceLogout();
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Force logout without API call (for failed login scenarios)
  const forceLogout = async () => {
    console.log('AuthContext: Force logout - clearing all state');
    
    // Clear all state
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    
    // Clear authService state
    authService.clearAuthData();
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
    // Ensure permissions is an array before using includes
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) return false;
    return permissions.includes(permissionName);
  };

  // Clear any authentication errors
  const clearError = () => {
    console.log('AuthContext: Clearing error');
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
