import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
    
    // Set up axios interceptors
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Token ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Note: Error handling is now centralized in apiService.js interceptor
  }
  
  // Show user-friendly error messages
  showAuthError(message, type = 'error') {
    // Create a temporary notification element
    const notification = document.createElement('div');
    
    let backgroundColor = '#f44336'; // error - red
    if (type === 'success') backgroundColor = '#4caf50'; // success - green
    if (type === 'warning') backgroundColor = '#ff9800'; // warning - orange
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      max-width: 400px;
      direction: rtl;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add CSS animation
    if (!document.getElementById('auth-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'auth-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds (longer for users to read)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  }

  async login(username, password, rememberMe = false) {
    try {
      console.log('AuthService: Attempting login...', {
        username,
        apiUrl: `${API_BASE_URL}/api/auth/login/`,
        hasPassword: !!password
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
        username,
        password,
      });

      console.log('AuthService: Login response received:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      this.token = response.data.token;
      this.user = response.data.user;
      this.permissions = response.data.permissions || {};

      console.log('AuthService: Storing auth data:', {
        token: this.token ? 'Present' : 'Missing',
        user: this.user,
        permissions: this.permissions
      });

      // Store in localStorage
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      localStorage.setItem('permissions', JSON.stringify(this.permissions));

      console.log('AuthService: Login completed successfully');
      return { success: true, user: this.user };
    } catch (error) {
      console.error('AuthService: Login failed:', error);
      console.error('AuthService: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Show user-friendly error message
      let errorMessage = 'فشل في تسجيل الدخول';
      
      if (error.response?.status === 401) {
        errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      } else if (error.response?.status === 403) {
        errorMessage = 'لا يوجد لديك صلاحية للوصول إلى هذا النظام';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'فشل في الاتصال بالخادم. يرجى المحاولة لاحقاً';
      }
      
      this.showAuthError(errorMessage);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token) {
        await axios.post(`${API_BASE_URL}/api/auth/logout/`);
      }
      
      // Show success message
      this.showAuthError('تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Show user-friendly error message but still logout locally
      let errorMessage = 'حدث خطأ في تسجيل الخروج من الخادم، ولكن تم تسجيل الخروج محلياً';
      
      if (error.response?.status === 403) {
        errorMessage = 'انتهت صلاحية الجلسة. تم تسجيل الخروج محلياً';
      }
      
      this.showAuthError(errorMessage, 'warning');
    } finally {
      // Clear local storage and state regardless of API call result
      this.clearAuthData();
    }
  }
  
  // Clear all authentication data (used for force logout)
  clearAuthData() {
    this.token = null;
    this.user = null;
    this.permissions = {};
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  }

  async checkAuthStatus() {
    try {
      if (!this.token) {
        return false;
      }

      const response = await axios.get(`${API_BASE_URL}/api/auth/check/`);
      
      // Update user data and permissions
      this.user = response.data.user;
      this.permissions = response.data.permissions;
      
      localStorage.setItem('user', JSON.stringify(this.user));
      localStorage.setItem('permissions', JSON.stringify(this.permissions));
      
      return true;
    } catch (error) {
      // Don't automatically logout on server check failure
      // Just return false to indicate authentication failed
      console.error('Auth check failed:', error);
      return false;
    }
  }

  async updateProfile(userData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile/`, userData);
      
      this.user = response.data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async changePassword(oldPassword, newPassword, confirmPassword) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/change-password/`, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async getPermissions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/permissions/`);
      
      this.permissions = response.data;
      localStorage.setItem('permissions', JSON.stringify(this.permissions));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // User management methods (Admin only)
  async getUsers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/users/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async createUser(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/users/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/auth/users/${userId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getCurrentUser() {
    return this.user;
  }

  getUserPermissions() {
    return this.permissions;
  }

  isAdmin() {
    if (!this.user) {
      return false;
    }
    
    // Based on the console logs, check the correct Django admin fields
    return this.user.is_staff || 
           this.user.is_superuser || 
           this.user.is_admin || 
           this.user.role === 'admin' ||
           this.permissions.is_admin ||
           false;
  }

  isNormalUser() {
    return this.permissions.is_normal_user || false;
  }

  canCreateCorrespondence() {
    return this.permissions.can_create_correspondence || false;
  }

  canEditCorrespondence() {
    return this.permissions.can_edit_correspondence || false;
  }

  canDeleteCorrespondence() {
    return this.permissions.can_delete_correspondence || false;
  }

  canManageUsers() {
    return this.permissions.can_manage_users || false;
  }

  canViewReports() {
    return this.permissions.can_view_reports || false;
  }

  canManagePermits() {
    return this.permissions.can_manage_permits || false;
  }

  getUserRole() {
    return this.user?.role || 'normal';
  }

  getUserRoleDisplay() {
    return this.user?.role_display || 'مستخدم عادي';
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
