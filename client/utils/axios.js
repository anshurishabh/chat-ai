
import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // 1. Production Mode (Vercel)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.') && !hostname.startsWith('10.')) {
      return 'https://nexchat-server-w5gq.onrender.com/api';
    }
    
    // 2. Mobile Local Testing Mode (Laptop IP used on phone)
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return `http://${hostname}:5000/api`;
    }
  }
  // 3. Absolute Local Fallback
  return 'http://localhost:5000/api';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const user = JSON.parse(localStorage.getItem('nexchat-user') || '{}');
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (err) {
        console.error("Axios request injection crash:", err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;