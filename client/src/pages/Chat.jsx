import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocket } from '../context/SocketContext';
import api from '../utils/axios';
import Sidebar from '../components/Sidebar';
import MessageArea from '../components/MessageArea';
import CallModal from '../components/CallModal';
import StoryViewer from '../components/StoryViewer';
import { useCallStore } from '../store/useCallStore';
import { useStoryStore } from '../store/useStoryStore';

export default function Chat() {
  const { setConversations, activeConversation, addMessage, updateMessage, removeMessage, removeConversation } = useChatStore();
  const { setIncomingCall } = useCallStore();
  const { addStory } = useStoryStore();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await api.get('/conversations');
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [setConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      addMessage(message);
      
      const state = useChatStore.getState();
      const user = useAuthStore.getState().user;
      
      if (state.activeConversation?._id === message.conversationId && message.sender._id !== user._id) {
        socket.emit('message_read', { messageId: message._id, conversationId: message.conversationId });
      }
    };

    const handleMessageDeleted = (messageId) => {
      // Find the message and update its content
      useChatStore.getState().messages.forEach(m => {
        if(m._id === messageId) {
          updateMessage({ ...m, isDeleted: true, content: 'Message deleted' });
        }
      });
    };

    const handleReactionAdded = ({ messageId, reactions }) => {
      const messages = useChatStore.getState().messages;
      const message = messages.find(m => m._id === messageId);
      if (message) {
        updateMessage({ ...message, reactions });
      }
    };

    const handleMessageSeen = ({ messageId, userId }) => {
      const messages = useChatStore.getState().messages;
      const message = messages.find(m => m._id === messageId);
      if (message && !message.readBy.includes(userId)) {
        updateMessage({ ...message, readBy: [...message.readBy, userId] });
      }
    };

    const handleConversationDeleted = (conversationId) => {
      removeConversation(conversationId);
    };

    const handleIncomingCall = (data) => {
      // data: { signal, from, name, avatar, type }
      setIncomingCall({
        from: data.from,
        name: data.name,
        avatar: data.avatar,
        type: data.type
      }, data.signal);
    };

    const handleNewStory = (story) => {
      addStory(story);
    };

    const handleMessageUpdated = (message) => {
      updateMessage(message);
    };

    const handleConversationUpdated = (updatedConv) => {
      setConversations(
        useChatStore.getState().conversations.map(c => 
          c._id === updatedConv._id ? updatedConv : c
        )
      );
      
      const activeConv = useChatStore.getState().activeConversation;
      if (activeConv?._id === updatedConv._id) {
        useChatStore.getState().setActiveConversation(updatedConv);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('reaction_added', handleReactionAdded);
    socket.on('message_seen', handleMessageSeen);
    socket.on('conversation_deleted', handleConversationDeleted);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('incoming_call', handleIncomingCall);
    socket.on('new_story', handleNewStory);
    socket.on('poll_updated', handleMessageUpdated);
    socket.on('todo_updated', handleMessageUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('reaction_added', handleReactionAdded);
      socket.off('message_seen', handleMessageSeen);
      socket.off('conversation_deleted', handleConversationDeleted);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('new_story', handleNewStory);
      socket.off('poll_updated', handleMessageUpdated);
      socket.off('todo_updated', handleMessageUpdated);
    };
  }, [socket, addMessage, updateMessage, removeConversation, setIncomingCall, addStory]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bgPrimary">
      <CallModal />
      <StoryViewer />
      
      {/* Sidebar - hidden on mobile if a conversation is active */}
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0`}>
        <Sidebar />
      </div>

      {/* Message Area - hidden on mobile if NO conversation is active */}
      <div className={`${!activeConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-bgPrimary`}>
        {activeConversation ? (
          <MessageArea />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-textMuted p-4 text-center">
            <div className="w-24 h-24 bg-bgSecondary rounded-full flex items-center justify-center mb-6 border border-borderBase shadow-sm">
              <span className="text-4xl text-accent font-display font-bold">CX</span>
            </div>
            <h2 className="text-2xl font-display font-medium text-textPrimary mb-2">Welcome to ConnectX</h2>
            <p className="max-w-md">Select a conversation from the sidebar or search for a user to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
