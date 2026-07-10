
import axios from 'axios';

// Dynamically check if the code is running on Vercel production or local machine
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // If running on Vercel production deployment
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://nexchat-server-w5gq.onrender.com/api';
    }
  }
  // Fallback for local summer training environment
  return 'http://localhost:5000/api';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // 15 seconds production timeout fallback
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
        console.error("Axios token injection runtime error:", err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;