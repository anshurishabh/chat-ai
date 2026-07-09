import axios from 'axios';

const axiosInstance = axios.create({
  // Direct explicit fallback if env variables glitch
  baseURL: 'http://localhost:5000/api',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('nexchat-user') || '{}');
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;