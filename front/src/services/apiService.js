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
      config.headers.Authorization = `Bearer ${token}`;
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
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

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

export const contactsApi = {
  getAll: (params = {}) => apiService.get('/contacts/', { params }),
  getApprovers: () => apiService.get('/contacts/approvers/'),
  getById: (id) => apiService.get(`/contacts/${id}/`),
  create: (data) => apiService.post('/contacts/', data),
  update: (id, data) => apiService.put(`/contacts/${id}/`, data),
  delete: (id) => apiService.delete(`/contacts/${id}/`),
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
