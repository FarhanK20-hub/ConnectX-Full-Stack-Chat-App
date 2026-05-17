import { create } from 'zustand';
import api from '../utils/axios';

export const useVaultStore = create((set, get) => ({
  isVaultUnlocked: false,
  lockedConversations: [],
  showVaultModal: false,
  
  setVaultUnlocked: (status) => set({ isVaultUnlocked: status }),
  setLockedConversations: (conversations) => set({ lockedConversations: conversations }),
  setShowVaultModal: (show) => set({ showVaultModal: show }),

  verifyPin: async (pin) => {
    try {
      const { data } = await api.post('/vault/verify', { pin });
      if (data.success) {
        set({ isVaultUnlocked: true, lockedConversations: data.lockedConversations, showVaultModal: false });
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  },

  lockConversation: async (conversationId) => {
    try {
      const { data } = await api.post('/vault/lock', { conversationId });
      set({ lockedConversations: data.lockedConversations });
    } catch (error) {
      throw error;
    }
  },

  unlockConversation: async (conversationId) => {
    try {
      const { data } = await api.post('/vault/unlock', { conversationId });
      set({ lockedConversations: data.lockedConversations });
    } catch (error) {
      throw error;
    }
  }
}));
