import axios from 'axios';

// Create axios instance with base configuration
const apiService = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authorization errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Show user-friendly message
      const message = error.response?.status === 401 
        ? 'انتهت صلاحية رمز المصادقة. يرجى تسجيل الدخول مرة أخرى'
        : 'لا يوجد لديك صلاحية للوصول إلى هذه العملية. سيتم تسجيل خروجك';
      
      // Show notification
      showAuthError(message, 'error');
      
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authPermissions');
      
      // Redirect to login after a short delay to allow user to read the message
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Helper function to show auth error notifications
function showAuthError(message, type = 'error') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#f44336' : '#ff9800'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
    direction: rtl;
    text-align: right;
  `;
  
  // Add animation keyframes if not already added
  if (!document.querySelector('#auth-notification-styles')) {
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
  
  // Remove after 4 seconds
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

// API endpoints
export const peopleApi = {
  getAll: (params = {}) => apiService.get('/people-history/', { params }),
  getCurrentOnly: () => apiService.get('/people-history/current_only/'),
  getById: (id) => apiService.get(`/people-history/${id}/`),
  getHistory: (id) => apiService.get(`/people-history/${id}/history/`),
  create: (data) => apiService.post('/people-history/', data),
  update: (id, data) => apiService.patch(`/people-history/${id}/`, data),
  delete: (id) => apiService.delete(`/people-history/${id}/`),
};

export const correspondenceApi = {
  getAll: (params = {}) => apiService.get('/correspondence/', { params }),
  getById: (id) => apiService.get(`/correspondence/${id}/`),
  create: (data) => apiService.post('/correspondence/', data),
  update: (id, data) => apiService.put(`/correspondence/${id}/`, data),
  delete: (id) => apiService.delete(`/correspondence/${id}/`),
  addContact: (correspondenceId, contactData) => apiService.post('/correspondence-contacts/', {
    correspondence: correspondenceId,
    ...contactData
  }),
};

export const correspondenceTypesApi = {
  getAll: () => apiService.get('/correspondence-types/'),
  getById: (id) => apiService.get(`/correspondence-types/${id}/`),
  create: (data) => apiService.post('/correspondence-types/', data),
  update: (id, data) => apiService.put(`/correspondence-types/${id}/`, data),
  delete: (id) => apiService.delete(`/correspondence-types/${id}/`),
};

export const correspondenceTypeProceduresApi = {
  getAll: (params = {}) => apiService.get('/correspondence-type-procedures/', { params }),
  getById: (id) => apiService.get(`/correspondence-type-procedures/${id}/`),
  create: (data) => apiService.post('/correspondence-type-procedures/', data),
  update: (id, data) => apiService.put(`/correspondence-type-procedures/${id}/`, data),
  delete: (id) => apiService.delete(`/correspondence-type-procedures/${id}/`),
  getByType: (typeId) => apiService.get(`/correspondence-type-procedures/?correspondence_type=${typeId}`),
};

export const correspondenceStatusLogsApi = {
  getAll: (params = {}) => apiService.get('/correspondence-status-logs/', { params }),
  getById: (id) => apiService.get(`/correspondence-status-logs/${id}/`),
  create: (data) => apiService.post('/correspondence-status-logs/', data),
  update: (id, data) => apiService.put(`/correspondence-status-logs/${id}/`, data),
  delete: (id) => apiService.delete(`/correspondence-status-logs/${id}/`),
  getByCorrespondence: (correspondenceId) => apiService.get(`/correspondence-status-logs/?correspondence=${correspondenceId}`),
};



export const contactsApi = {
  getAll: (params = {}) => apiService.get('/contacts/', { params }),
  getApprovers: () => apiService.get('/contacts/approvers/'),
  getById: (id) => apiService.get(`/contacts/${id}/`),
  create: (data) => apiService.post('/contacts/', data),
  update: (id, data) => apiService.put(`/contacts/${id}/`, data),
  delete: (id) => apiService.delete(`/contacts/${id}/`),
};

export const attachmentsApi = {
  getAll: (params = {}) => apiService.get('/attachments/', { params }),
  getById: (id) => apiService.get(`/attachments/${id}/`),
  getByCorrespondence: (correspondenceId) => apiService.get(`/attachments/?correspondence=${correspondenceId}`),
  upload: (correspondenceId, files) => {
    const formData = new FormData();
    formData.append('correspondence_id', correspondenceId);
    
    // Add all files to FormData
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    return apiService.post('/attachments/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  download: (id) => apiService.get(`/attachments/${id}/download/`, {
    responseType: 'blob',
  }),
  delete: (id) => apiService.delete(`/attachments/${id}/`),
};

export const permitsApi = {
  getAll: (params = {}) => apiService.get('/permits/', { params }),
  getActive: () => apiService.get('/permits/active/'),
  getExpiringSoon: () => apiService.get('/permits/expiring_soon/'),
  getById: (id) => apiService.get(`/permits/${id}/`),
  create: (data) => apiService.post('/permits/', data),
  update: (id, data) => apiService.patch(`/permits/${id}/`, data),
  delete: (id) => apiService.delete(`/permits/${id}/`),
};

export const vehiclesApi = {
  getAll: (params = {}) => apiService.get('/vehicles/', { params }),
  getById: (id) => apiService.get(`/vehicles/${id}/`),
  create: (data) => apiService.post('/vehicles/', data),
  update: (id, data) => apiService.patch(`/vehicles/${id}/`, data),
  delete: (id) => apiService.delete(`/vehicles/${id}/`),
};

export const cardPermitsApi = {
  getAll: (params = {}) => apiService.get('/card-permits/', { params }),
  getActive: () => apiService.get('/card-permits/active/'),
  getExpiringSoon: () => apiService.get('/card-permits/expiring_soon/'),
  getById: (id) => apiService.get(`/card-permits/${id}/`),
  create: (data) => apiService.post('/card-permits/', data),
  update: (id, data) => apiService.patch(`/card-permits/${id}/`, data),
  delete: (id) => apiService.delete(`/card-permits/${id}/`),
};

export const settingsApi = {
  getAll: () => apiService.get('/settings/'),
  getById: (id) => apiService.get(`/settings/${id}/`),
  create: (data) => apiService.post('/settings/', data),
  update: (id, data) => apiService.put(`/settings/${id}/`, data),
  delete: (id) => apiService.delete(`/settings/${id}/`),
  getByCategory: (category) => apiService.get(`/settings/?category=${category}`),
  getByKey: (key) => apiService.get(`/settings/?key=${key}`),
};

export const accidentsApi = {
  getAll: (params = {}) => apiService.get('/accidents/', { params }),
  getById: (id) => apiService.get(`/accidents/${id}/`),
  create: (data) => apiService.post('/accidents/', data),
  update: (id, data) => apiService.patch(`/accidents/${id}/`, data),
  delete: (id) => apiService.delete(`/accidents/${id}/`),
};

export const companiesApi = {
  getAll: (params = {}) => apiService.get('/companies-history/', { params }),
  getCurrentOnly: () => apiService.get('/companies-history/current_only/'),
  getById: (id) => apiService.get(`/companies-history/${id}/`),
  create: (data) => apiService.post('/companies-history/', data),
  update: (id, data) => apiService.patch(`/companies-history/${id}/`, data),
  delete: (id) => apiService.delete(`/companies-history/${id}/`),
};

export { apiService };
