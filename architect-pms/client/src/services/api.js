const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  let serverBase = import.meta.env.VITE_SERVER_BASE_URL;
  if (!serverBase && API_BASE.startsWith('http')) {
    try {
      const url = new URL(API_BASE);
      serverBase = url.origin;
    } catch (e) {
      serverBase = '';
    }
  }
  return `${serverBase || ''}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('pms_token');
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API Request failed');
  }

  return data;
};

export const fetchFormDataAPI = async (endpoint, method = 'POST', formData) => {
  return fetchAPI(endpoint, {
    method,
    body: formData,
  });
};


