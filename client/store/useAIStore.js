import { create } from 'zustand';
import axios from '../utils/axios';

const useAIStore = create((set) => ({
  smartReplies: [],
  aiMessages: [],
  summary: '',
  loading: false,

  getSmartReplies: async (messages) => {
    try {
      const { data } = await axios.post('/ai/smart-replies', { messages });
      set({ smartReplies: data.replies });
    } catch (error) {
      console.error(error);
    }
  },

  clearSmartReplies: () => set({ smartReplies: [] }),

  chatWithAI: async (message, history) => {
    set({ loading: true });
    try {
      const { data } = await axios.post('/ai/chat', { message, history });
      set((state) => ({
        aiMessages: [...state.aiMessages, 
          { role: 'user', content: message },
          { role: 'assistant', content: data.reply }
        ],
        loading: false
      }));
      return data.reply;
    } catch (error) {
      set({ loading: false });
      console.error(error);
    }
  },

  translateMessage: async (text, targetLanguage) => {
    try {
      const { data } = await axios.post('/ai/translate', { text, targetLanguage });
      return data.translated;
    } catch (error) {
      console.error(error);
    }
  },

  detectSentiment: async (text) => {
    try {
      const { data } = await axios.post('/ai/sentiment', { text });
      return data;
    } catch (error) {
      console.error(error);
    }
  },

  summarizeChat: async (messages) => {
    set({ loading: true });
    try {
      const { data } = await axios.post('/ai/summarize', { messages });
      set({ summary: data.summary, loading: false });
      return data.summary;
    } catch (error) {
      set({ loading: false });
      console.error(error);
    }
  },

  correctGrammar: async (text) => {
    try {
      const { data } = await axios.post('/ai/grammar', { text });
      return data.corrected;
    } catch (error) {
      console.error(error);
    }
  },

  clearAIMessages: () => set({ aiMessages: [] }),
}));

export default useAIStore;