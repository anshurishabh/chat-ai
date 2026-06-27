import { create } from 'zustand';
import axios from '../utils/axios';

const useChatStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  messages: [],
  groups: [],
  selectedGroup: null,
  onlineUsers: [],
  typingUsers: [],
  loading: false,

  getUsers: async () => {
    try {
      const { data } = await axios.get('/auth/users');
      set({ users: data });
    } catch (error) {
      console.error(error);
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user, selectedGroup: null, messages: [] }),
  setSelectedGroup: (group) => set({ selectedGroup: group, selectedUser: null, messages: [] }),

  getMessages: async (userId) => {
    set({ loading: true });
    try {
      const { data } = await axios.get(`/messages/${userId}`);
      set({ messages: data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error(error);
    }
  },

  getGroupMessages: async (groupId) => {
    set({ loading: true });
    try {
      const { data } = await axios.get(`/messages/group/${groupId}`);
      set({ messages: data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error(error);
    }
  },

  sendMessage: async (messageData) => {
    try {
      const { data } = await axios.post('/messages', messageData);
      set((state) => ({ messages: [...state.messages, data] }));
    } catch (error) {
      console.error(error);
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addTypingUser: (userId) => {
    set((state) => ({
      typingUsers: [...new Set([...state.typingUsers, userId])]
    }));
  },

  removeTypingUser: (userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((id) => id !== userId)
    }));
  },

  getGroups: async () => {
    try {
      const { data } = await axios.get('/groups');
      set({ groups: data });
    } catch (error) {
      console.error(error);
    }
  },
}));

export default useChatStore;