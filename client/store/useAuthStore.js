import { create } from 'zustand';
import axios from '../utils/axios';

const getUser = () => {
  if (typeof window === 'undefined') return null;
  return JSON.parse(localStorage.getItem('nexchat-user') || 'null');
};

const useAuthStore = create((set) => ({
  user: getUser(),
  loading: false,
  error: null,

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post('/auth/register', { name, email, password });
      localStorage.setItem('nexchat-user', JSON.stringify(data));
      set({ user: data, loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error', loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post('/auth/login', { email, password });
      localStorage.setItem('nexchat-user', JSON.stringify(data));
      set({ user: data, loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('nexchat-user');
    set({ user: null });
  },
}));

export default useAuthStore;