import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const role = localStorage.getItem('role');
  const tokenKey = role === 'facilitator' ? 'facilitator_token' : 'patient_token';
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 redirect to appropriate login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const role = localStorage.getItem('role');
      if (role === 'facilitator') {
        window.location.href = '/dashboard/login';
      } else {
        localStorage.removeItem('patient_token');
        localStorage.removeItem('role');
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
