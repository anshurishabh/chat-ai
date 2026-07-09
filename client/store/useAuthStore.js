
import { create } from 'zustand';
import axios from '../utils/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,
  theme: 'dark',
  isHydrated: false,

  hydrateAuth: () => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('nexchat-user');
        if (storedUser && storedUser !== 'null') {
          const parsed = JSON.parse(storedUser);
          set({ user: parsed, theme: parsed.theme || 'dark', isHydrated: true });
        } else {
          set({ isHydrated: true });
        }
      } catch (err) {
        console.error("Hydration error handler:", err);
        set({ isHydrated: true });
      }
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      // Explicit data layout mapping to secure network tunnel payload processing
      const { data } = await axios.post('/auth/register', { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password 
      });
      if (data && data.token) {
        localStorage.setItem('nexchat-user', JSON.stringify(data));
        set({ user: data, loading: false, theme: data.theme || 'dark' });
        return true;
      }
      set({ error: 'Invalid response from server matrix', loading: false });
      return false;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed. Network boundary error.';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Standardize input parsing arrays context to prevent compile anomalies
      const { data } = await axios.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      if (data && data.token) {
        localStorage.setItem('nexchat-user', JSON.stringify(data));
        set({ user: data, loading: false, theme: data.theme || 'dark' });
        return true;
      }
      set({ error: 'Invalid response context payload', loading: false });
      return false;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login rejected. Verify credential values.';
      set({ error: errMsg, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('nexchat-user');
    set({ user: null, theme: 'dark' });
  },

  updateProfile: async (updates) => {
    try {
      const { data } = await axios.put('/auth/profile', updates);
      set((state) => {
        const merged = { ...state.user, ...data };
        localStorage.setItem('nexchat-user', JSON.stringify(merged));
        return { user: merged, theme: merged.theme || state.theme };
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  toggleTheme: async () => {
    const { user, theme } = get();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    if (user) {
      await get().updateProfile({ theme: newTheme });
    }
  },
}));

export default useAuthStore;