import axios from 'axios';

// Resolve backend api url from environment variables, fallback to docker-compose default localhost setup
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format responses or standard errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    if (typeof message === 'object') {
      if (Array.isArray(message)) {
        message = message.map((e) => e.msg).join(', ');
      } else {
        message = JSON.stringify(message);
      }
    }
    
    // Create a normalized error object to propagate
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    normalizedError.data = error.response?.data;
    
    return Promise.reject(normalizedError);
  }
);

export default api;
