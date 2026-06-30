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
  replyingTo: null,
  pinnedMessages: [],
  searchResults: [],
  searchQuery: '',
  showSearch: false,
  blockedUsers: [],
  viewingProfile: null,
  wallpapers: {},

  getUsers: async () => {
    try {
      const { data } = await axios.get('/auth/users');
      set({ users: data });
    } catch (error) {
      console.error(error);
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user, selectedGroup: null, messages: [], replyingTo: null }),
  setSelectedGroup: (group) => set({ selectedGroup: group, selectedUser: null, messages: [], replyingTo: null }),

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
    set((state) => {
      if (state.messages.find(m => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessage: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map(m => m._id === updatedMessage._id ? updatedMessage : m)
    }));
  },

  removeMessageLocally: (messageId) => {
    set((state) => ({
      messages: state.messages.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
      )
    }));
  },

  editMessage: async (messageId, newContent) => {
    try {
      const { data } = await axios.put(`/messages/${messageId}`, { content: newContent });
      get().updateMessage(data);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axios.delete(`/messages/${messageId}`);
      get().removeMessageLocally(messageId);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const { data } = await axios.post(`/messages/${messageId}/reaction`, { emoji });
      get().updateMessage(data);
    } catch (error) {
      console.error(error);
    }
  },

  togglePin: async (messageId) => {
    try {
      const { data } = await axios.put(`/messages/${messageId}/pin`);
      get().updateMessage(data);
      get().getPinnedMessages();
    } catch (error) {
      console.error(error);
    }
  },

  getPinnedMessages: async () => {
    const { selectedUser, selectedGroup } = get();
    try {
      const params = selectedGroup ? `groupId=${selectedGroup._id}` : `userId=${selectedUser?._id}`;
      const { data } = await axios.get(`/messages/pinned?${params}`);
      set({ pinnedMessages: data });
    } catch (error) {
      console.error(error);
    }
  },

  setReplyingTo: (message) => set({ replyingTo: message }),
  clearReplyingTo: () => set({ replyingTo: null }),

  toggleSearch: () => set((state) => ({ showSearch: !state.showSearch, searchQuery: '', searchResults: [] })),

  searchMessages: async (query) => {
    const { selectedUser, selectedGroup } = get();
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const params = selectedGroup
        ? `query=${encodeURIComponent(query)}&groupId=${selectedGroup._id}`
        : `query=${encodeURIComponent(query)}&userId=${selectedUser?._id}`;
      const { data } = await axios.get(`/messages/search?${params}`);
      set({ searchResults: data });
    } catch (error) {
      console.error(error);
    }
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

  // --- Profile / Block / Report ---
  viewProfile: async (userId) => {
    try {
      const { data } = await axios.get(`/auth/user/${userId}`);
      set({ viewingProfile: data });
    } catch (error) {
      console.error(error);
    }
  },

  closeProfile: () => set({ viewingProfile: null }),

  getBlockedUsers: async () => {
    try {
      const { data } = await axios.get('/auth/blocked');
      set({ blockedUsers: data });
    } catch (error) {
      console.error(error);
    }
  },

  blockUser: async (userId) => {
    try {
      await axios.put(`/auth/block/${userId}`);
      set((state) => ({
        users: state.users.filter(u => u._id !== userId),
        selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser,
      }));
      get().getBlockedUsers();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  unblockUser: async (userId) => {
    try {
      await axios.put(`/auth/unblock/${userId}`);
      get().getBlockedUsers();
      get().getUsers();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  reportUser: async (userId, reason) => {
    try {
      await axios.post(`/auth/report/${userId}`, { reason });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
}));

export default useChatStore;