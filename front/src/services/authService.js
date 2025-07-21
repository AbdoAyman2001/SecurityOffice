import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
    
    // Set up axios interceptor for authentication
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Request interceptor to add auth token
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

    // Response interceptor to handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username, password, rememberMe = false) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
        username,
        password,
        remember_me: rememberMe
      });

      const { user, token, permissions } = response.data;
      
      // Store auth data
      this.token = token;
      this.user = user;
      this.permissions = permissions;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('permissions', JSON.stringify(permissions));

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async logout() {
    try {
      if (this.token) {
        await axios.post(`${API_BASE_URL}/api/auth/logout/`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data
      this.token = null;
      this.user = null;
      this.permissions = {};
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    }
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
      this.logout();
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
    return this.permissions.is_admin || false;
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
