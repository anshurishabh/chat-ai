import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL 
    ? `${process.env.NEXT_PUBLIC_SERVER_URL}/api`
    : 'http://localhost:5000/api',
});

axiosInstance.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('nexchat-user') || '{}');
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default axiosInstance;