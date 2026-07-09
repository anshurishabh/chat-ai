import { create } from 'zustand';
import axios from '../utils/axios';

const useAuthStore = create((set, get) => ({
  user: null, // Initial execution state holds null for SSR sync safety
  loading: false,
  error: null,
  theme: 'dark',
  isHydrated: false, // Flag to verify if hydration completed safely

  // Method to safely hydrate client state after mounting
  hydrateAuth: () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('nexchat-user');
      if (storedUser && storedUser !== 'null') {
        const parsed = JSON.parse(storedUser);
        set({ user: parsed, theme: parsed.theme || 'dark', isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post('/auth/register', { name, email, password });
      localStorage.setItem('nexchat-user', JSON.stringify(data));
      set({ user: data, loading: false, theme: data.theme || 'dark' });
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
      set({ user: data, loading: false, theme: data.theme || 'dark' });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error', loading: false });
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