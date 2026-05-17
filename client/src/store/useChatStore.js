import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: new Set(),
  
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  removeConversation: (conversationId) => set((state) => ({
    conversations: state.conversations.filter(c => c._id !== conversationId),
    activeConversation: state.activeConversation?._id === conversationId ? null : state.activeConversation
  })),
  
  addMessage: (message) => {
    const { activeConversation } = get();
    // Only add if it belongs to current active conversation
    if (activeConversation && message.conversationId === activeConversation._id) {
      set((state) => ({ messages: [...state.messages, message] }));
    }
    
    // Update conversation lastMessage
    set((state) => ({
      conversations: state.conversations.map((c) => 
        c._id === message.conversationId 
          ? { ...c, lastMessage: message } 
          : c
      )
    }));
  },

  updateMessage: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map((m) => m._id === updatedMessage._id ? updatedMessage : m)
    }));
  },
  
  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId)
    }));
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
  addOnlineUser: (userId) => set((state) => {
    const newSet = new Set(state.onlineUsers);
    newSet.add(userId);
    return { onlineUsers: newSet };
  }),
  removeOnlineUser: (userId) => set((state) => {
    const newSet = new Set(state.onlineUsers);
    newSet.delete(userId);
    return { onlineUsers: newSet };
  }),
}));
