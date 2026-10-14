import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  try {
    const auth = JSON.parse(localStorage.getItem('auth'));
    if (auth && auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
  } catch {
    /* ignore corrupted storage */
  }
  return config;
});

// An expired or invalid session on a protected route signs the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = (err.config && err.config.url) || '';
    if (err.response && err.response.status === 401 && !url.startsWith('/auth/')) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
