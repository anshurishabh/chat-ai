
import { create } from 'zustand';
import axios from '../utils/axios';

const useChatStore = create((set, get) => ({
  contacts: [],
  searchResults: [],
  searchQuery: '',
  selectedUser: null,
  selectedGroup: null,
  messages: [],
  groups: [],
  onlineUsers: [],
  typingUsers: [],
  loading: false,
  replyTo: null,
  pinnedMessages: [],
  msgSearchResults: [],
  msgSearchQuery: '',
  showMsgSearch: false,
  blockedUsers: [],
  viewProfile: null,
  viewingProfile: null,
  wallpapers: {},
  showAIChat: false,

  // CRITICAL MISSING LINK FIXED: Explicitly register the messages array wrapper modifier
  setMessages: (messages) => set({ messages }),

  getContacts: async () => {
    try {
      const { data } = await axios.get('/auth/contacts');
      set({ contacts: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error("Fetch contacts error logs handled:", error);
    }
  },

  searchUsers: async (query) => {
    set({ searchQuery: query });
    if (!query || !query.trim() || query.trim().length < 2) {
      set({ searchResults: [] });
      return;
    }
    try {
      const { data } = await axios.get(`/auth/search?q=${encodeURIComponent(query.trim())}`);
      set({ searchResults: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error("User context network layout matching crash trace:", error);
      set({ searchResults: [] });
    }
  },

  clearSearch: () => set({ searchQuery: '', searchResults: [] }),

  setSelectedUser: (user) => set({ selectedUser: user, selectedGroup: null, messages: [], replyTo: null, showAIChat: false }),
  setSelectedGroup: (group) => set({ selectedGroup: group, selectedUser: null, messages: [], replyTo: null, showAIChat: false }),
  setShowAIChat: (val) => set({ showAIChat: val, selectedUser: null, selectedGroup: null }),

  getMessages: async (userId) => {
    set({ loading: true });
    try {
      const { data } = await axios.get(`/messages/${userId}`);
      set({ messages: data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ loading: true });
    try {
      const { data } = await axios.get(`/messages/group/${groupId}`);
      set({ messages: data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  // Filename: .\client\store\useChatStore.js

sendMessage: async (messageData) => {
  try {
    // 1. API ko message bhejo
    const { data } = await axios.post('/messages', messageData);
    
    // 2. CRITICAL: Yahan state ko update karo taaki message screen par dikhe
    set((state) => ({ 
      messages: [...state.messages, data] 
    }));
    
    return data; // Success return karo
  } catch (error) {
    console.error("Message bhejne mein error:", error);
    throw error;
  }
},

  addMessage: (message) => {
    set((state) => {
      if (state.messages.find(m => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    });
    get().getContacts();
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
      return false;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axios.delete(`/messages/${messageId}`);
      get().removeMessageLocally(messageId);
      return true;
    } catch (error) {
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

  setReplyingTo: (message) => set({ replyTo: message }),
  clearReplyingTo: () => set({ replyTo: null }),

  toggleMsgSearch: () => set((state) => ({ showMsgSearch: !state.showMsgSearch, msgSearchQuery: '', msgSearchResults: [] })),

  searchMessages: async (query) => {
    const { selectedUser, selectedGroup } = get();
    set({ msgSearchQuery: query });
    if (!query.trim()) { set({ msgSearchResults: [] }); return; }
    try {
      const params = selectedGroup
        ? `query=${encodeURIComponent(query)}&groupId=${selectedGroup._id}`
        : `query=${encodeURIComponent(query)}&userId=${selectedUser?._id}`;
      const { data } = await axios.get(`/messages/search?${params}`);
      set({ msgSearchResults: data });
    } catch (error) {
      console.error(error);
    }
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addTypingUser: (userId) => set((state) => ({ typingUsers: [...new Set([...state.typingUsers, userId])] })),
  removeTypingUser: (userId) => set((state) => ({ typingUsers: state.typingUsers.filter(id => id !== userId) })),

  getGroups: async () => {
    try {
      const { data } = await axios.get('/groups');
      set({ groups: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error(error);
    }
  },

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
      set({ blockedUsers: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error(error);
    }
  },

  blockUser: async (userId) => {
    try {
      await axios.put(`/auth/block/${userId}`);
      set((state) => ({
        contacts: state.contacts.filter(u => u._id !== userId),
        selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser,
      }));
      get().getBlockedUsers();
      return true;
    } catch (error) {
      return false;
    }
  },

  unblockUser: async (userId) => {
    try {
      await axios.put(`/auth/unblock/${userId}`);
      get().getBlockedUsers();
      return true;
    } catch (error) {
      return false;
    }
  },

  reportUser: async (userId, reason) => {
    try {
      await axios.post(`/auth/report/${userId}`, { reason });
      return true;
    } catch (error) {
      return false;
    }
  },
}));

export default useChatStore;