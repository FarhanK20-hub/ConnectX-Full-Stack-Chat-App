import React, { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon, Smile, MoreVertical, Phone, Video, Trash2, ArrowLeft, Mic, Square, Lock, Unlock, CalendarClock, BarChart2, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCallStore } from '../store/useCallStore';
import { useSocket } from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import UserProfileModal from './UserProfileModal';
import GifPicker from './GifPicker';
import ScheduleMessageModal from './ScheduleMessageModal';
import CreatePollModal from './CreatePollModal';
import CreateTodoModal from './CreateTodoModal';
import PinnedMessagesBanner from './PinnedMessagesBanner';
import StickerPicker from './StickerPicker';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import api from '../utils/axios';
import { useVaultStore } from '../store/useVaultStore';

export default function MessageArea() {
  const { activeConversation, messages, setMessages, onlineUsers, removeConversation, setActiveConversation } = useChatStore();
  const { user } = useAuthStore();
  const { startCall } = useCallStore();
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { lockedConversations, lockConversation, unlockConversation } = useVaultStore();
  const isChatLocked = lockedConversations.includes(activeConversation?._id);
  const typingTimeoutRef = useRef(null);
  const [typists, setTypists] = useState(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Determine header info
  let displayName = activeConversation.name;
  let displayAvatar = activeConversation.avatar;
  let isOnline = false;

  if (!activeConversation.isGroup) {
    const otherMember = activeConversation.members.find(m => m._id !== user._id);
    if (otherMember) {
      displayName = otherMember.name;
      displayAvatar = otherMember.avatar;
      isOnline = onlineUsers.has(otherMember._id) || otherMember.isOnline;
    }
  }

  if (!displayAvatar) {
    displayAvatar = 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  }

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch initial messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/messages/${activeConversation._id}?limit=50`);
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        
        // Mark unread messages as read
        if (socket) {
          const unreadMessages = data.messages.filter(m => 
            m.sender._id !== user._id && !m.readBy.includes(user._id)
          );
          unreadMessages.forEach(m => {
            socket.emit('message_read', { messageId: m._id, conversationId: activeConversation._id });
          });
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    if (socket && activeConversation) {
      socket.emit('join_conversation', activeConversation._id);
    }
    
    return () => {
      if (socket && activeConversation) {
        socket.emit('leave_conversation', activeConversation._id);
      }
    };
  }, [activeConversation, setMessages, socket, user._id]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;
    try {
      setIsLoadingMore(true);
      const { data } = await api.get(`/messages/${activeConversation._id}?limit=50&cursor=${nextCursor}`);
      setMessages([...data.messages, ...messages]); // prepend older messages
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  // Handle typing events
  useEffect(() => {
    if (!socket) return;
    
    const handleUserTyping = ({ userId, conversationId }) => {
      if (conversationId === activeConversation?._id) {
        setTypists(prev => new Set(prev).add(userId));
      }
    };
    
    const handleUserStoppedTyping = ({ userId, conversationId }) => {
      if (conversationId === activeConversation?._id) {
        setTypists(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    };
    
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    
    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, activeConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typists]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket && activeConversation) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing_start', { conversationId: activeConversation._id });
      }
      
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing_stop', { conversationId: activeConversation._id });
      }, 2000);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSendGif = async (gifUrl) => {
    try {
      setShowGifPicker(false);
      const tempId = Date.now().toString();
      
      const tempMessage = {
        _id: tempId,
        conversationId: activeConversation._id,
        sender: user,
        content: gifUrl,
        type: 'gif',
        createdAt: new Date().toISOString(),
        status: 'sending'
      };

      addMessage(tempMessage);

      await api.post('/messages', {
        conversationId: activeConversation._id,
        content: gifUrl,
        type: 'gif'
      });
    } catch (error) {
      console.error('Failed to send GIF:', error);
    }
  };

  const handleSendSticker = async (stickerUrl) => {
    try {
      setShowStickerPicker(false);
      const tempId = Date.now().toString();
      
      const tempMessage = {
        _id: tempId,
        conversationId: activeConversation._id,
        sender: user,
        content: stickerUrl,
        type: 'sticker',
        createdAt: new Date().toISOString(),
        status: 'sending'
      };

      addMessage(tempMessage);

      await api.post('/messages', {
        conversationId: activeConversation._id,
        content: stickerUrl,
        type: 'sticker'
      });
    } catch (error) {
      console.error('Failed to send Sticker:', error);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice.webm');
        
        try {
          const { data: uploadData } = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          await api.post('/messages', {
            content: uploadData.url,
            conversationId: activeConversation._id,
            type: 'audio'
          });
        } catch (error) {
          console.error('Failed to upload audio:', error);
          toast.error('Failed to send voice message');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Microphone access denied:', error);
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    try {
      const contentText = newMessage;
      const fileToUpload = selectedImage;
      
      setNewMessage('');
      setSelectedImage(null);
      setShowEmojiPicker(false);
      
      if (socket && isTyping) {
        setIsTyping(false);
        clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', { conversationId: activeConversation._id });
      }

      if (fileToUpload) {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        const { data: uploadData } = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        await api.post('/messages', {
          content: uploadData.url,
          conversationId: activeConversation._id,
          type: 'image'
        });
        
        if (contentText.trim()) {
          await api.post('/messages', {
            content: contentText,
            conversationId: activeConversation._id,
            type: 'text'
          });
        }
      } else {
        await api.post('/messages', {
          content: contentText,
          conversationId: activeConversation._id,
          type: 'text'
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
  };

  const handleDeleteChat = async () => {
    if (window.confirm('Are you sure you want to completely delete this chat? This action cannot be undone.')) {
      try {
        const conversationId = activeConversation._id;
        await api.delete(`/conversations/${conversationId}/delete`);
        removeConversation(conversationId);
        toast.success('Chat deleted successfully');
      } catch (error) {
        console.error('Failed to delete chat:', error);
        toast.error(error.response?.data?.message || error.message || 'Failed to delete chat');
      }
    }
  };

  const handleStartCall = (type) => {
    // Determine the user ID to call (works for 1-on-1 chats)
    if (!activeConversation.isGroup) {
      const otherMember = activeConversation.members.find(m => m._id !== user._id);
      if (otherMember) {
        startCall(otherMember._id, type);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-bgPrimary relative">
      {/* Profile Modal */}
      {selectedUserForProfile && (
        <div className="absolute inset-0 z-50">
          <UserProfileModal 
            user={selectedUserForProfile} 
            onClose={() => setSelectedUserForProfile(null)} 
            onMessage={() => setSelectedUserForProfile(null)}
            onCall={(type) => {
              setSelectedUserForProfile(null);
              startCall(selectedUserForProfile._id, type);
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="h-16 border-b border-borderBase bg-bgSecondary/50 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 text-textMuted hover:text-textPrimary hover:bg-bgCard rounded-full transition-colors mr-1"
            onClick={() => setActiveConversation(null)}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              if (!activeConversation.isGroup) {
                const otherMember = activeConversation.members.find(m => m._id !== user._id);
                setSelectedUserForProfile(otherMember);
              }
            }}
          >
          <div className="relative">
            <img src={displayAvatar} alt={displayName} className="w-10 h-10 rounded-full object-cover bg-bgCard border border-borderBase group-hover:border-accent transition-colors" />
            {isOnline && !activeConversation.isGroup && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-bgSecondary rounded-full"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-medium text-textPrimary leading-none">{displayName}</h3>
              {!activeConversation.isGroup && activeConversation.streak?.count >= 3 && (
                <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full" title={`${activeConversation.streak.count} day streak!`}>
                  🔥 {activeConversation.streak.count}
                </span>
              )}
            </div>
            <p className="text-xs text-textMuted leading-none truncate max-w-[150px] sm:max-w-[200px] mt-1">
              {activeConversation.isGroup ? `${activeConversation.members.length} members` : (isOnline ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 text-textMuted relative">
          <button 
            className="hover:text-accent transition-colors disabled:opacity-50"
            onClick={() => handleStartCall('audio')}
            disabled={activeConversation.isGroup}
            title={activeConversation.isGroup ? "Calls not supported in groups yet" : "Voice Call"}
          >
            <Phone size={20} />
          </button>
          <button 
            className="hover:text-accent transition-colors disabled:opacity-50"
            onClick={() => handleStartCall('video')}
            disabled={activeConversation.isGroup}
            title={activeConversation.isGroup ? "Calls not supported in groups yet" : "Video Call"}
          >
            <Video size={20} />
          </button>
          <button 
            className="hover:text-accent transition-colors"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <MoreVertical size={20} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-8 bg-bgSecondary border border-borderBase rounded-xl shadow-xl overflow-hidden min-w-[180px] py-1">
              <button 
                onClick={async () => {
                  try {
                    if (isChatLocked) {
                      await unlockConversation(activeConversation._id);
                      toast.success('Chat unlocked');
                    } else {
                      await lockConversation(activeConversation._id);
                      toast.success('Chat locked and moved to Vault');
                      setActiveConversation(null); // Close the chat view if we lock it, since it should be hidden
                    }
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to toggle lock');
                  }
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-bgCard flex items-center gap-2 transition-colors ${isChatLocked ? 'text-textPrimary' : 'text-accent'}`}
              >
                {isChatLocked ? <Unlock size={16} /> : <Lock size={16} />}
                {isChatLocked ? 'Unlock Chat' : 'Lock Chat'}
              </button>
              <button 
                onClick={handleDeleteChat}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-bgCard flex items-center gap-2 transition-colors border-t border-borderBase"
              >
                <Trash2 size={16} />
                Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>

      <PinnedMessagesBanner conversation={activeConversation} />

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-bgPrimary"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex justify-center mt-10">
            <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isLoadingMore && (
              <div className="flex justify-center my-4">
                <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
            {messages.length === 0 ? (
              <div className="text-center text-textMuted mt-10 text-sm">
                This is the beginning of your conversation with {displayName}.
              </div>
            ) : (
              messages.map((msg, index) => {
                // Show date divider if needed
                const prevMsg = messages[index - 1];
                let showDateDivider = false;
                if (!prevMsg) {
                  showDateDivider = true;
                } else {
                  const prevDate = new Date(prevMsg.createdAt).toDateString();
                  const currDate = new Date(msg.createdAt).toDateString();
                  showDateDivider = prevDate !== currDate;
                }

                return (
                  <React.Fragment key={msg._id || index}>
                    {showDateDivider && (
                      <div className="flex justify-center mb-6">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-textMuted bg-bgSecondary px-3 py-1 rounded-full border border-borderBase">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <MessageBubble message={msg} />
                  </React.Fragment>
                );
              })
            )}
            
            {/* Typing Indicator */}
            {typists.size > 0 && (
              <div className="flex items-center gap-2 text-textMuted text-xs mb-4">
                <div className="bg-bgCard border border-borderBase px-3 py-2 rounded-bubble rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-bgPrimary border-t border-borderBase">
        {selectedImage && (
          <div className="mb-3 max-w-4xl mx-auto relative inline-block">
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Preview" 
              className="h-24 w-auto rounded-lg border border-borderBase object-cover" 
            />
            <button 
              type="button"
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1 shadow-md hover:bg-opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto relative">
          
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden border border-borderBase">
              <Picker 
                data={data} 
                onEmojiSelect={addEmoji} 
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          )}

          <div className="bg-bgSecondary border border-borderBase rounded-2xl flex-1 flex items-end p-1 transition-colors focus-within:border-accent relative">
            {showGifPicker && (
              <GifPicker 
                onSelect={handleSendGif} 
                onClose={() => setShowGifPicker(false)} 
              />
            )}
            <button 
              type="button" 
              className={`p-2.5 transition-colors shrink-0 ${showEmojiPicker ? 'text-accent' : 'text-textMuted hover:text-accent'}`}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
            >
              <Smile size={20} />
            </button>
            <button 
              type="button" 
              className={`p-2.5 font-bold text-xs flex items-center justify-center transition-colors shrink-0 ${showGifPicker ? 'text-accent' : 'text-textMuted hover:text-accent'}`}
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
                setShowStickerPicker(false);
              }}
            >
              GIF
            </button>
            <div className="relative">
              <button 
                type="button" 
                className={`p-2.5 flex items-center justify-center transition-colors shrink-0 ${showStickerPicker ? 'text-accent' : 'text-textMuted hover:text-accent'}`}
                onClick={() => {
                  setShowStickerPicker(!showStickerPicker);
                  setShowGifPicker(false);
                  setShowEmojiPicker(false);
                }}
                title="Stickers"
              >
                <div className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-md overflow-hidden relative">
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-bgCard rounded-full rotate-45 transform origin-top-left border-t-2 border-l-2 border-current"></div>
                </div>
              </button>
              {showStickerPicker && (
                <StickerPicker 
                  onClose={() => setShowStickerPicker(false)}
                  onSendSticker={handleSendSticker}
                  conversation={activeConversation}
                />
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-textMuted hover:text-accent transition-colors shrink-0"
              title="Upload Image"
            >
              <ImageIcon size={20} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowPollModal(true)}
              className="p-2.5 text-textMuted hover:text-accent transition-colors shrink-0"
              title="Create Poll"
            >
              <BarChart2 size={20} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowTodoModal(true)}
              className="p-2.5 text-textMuted hover:text-success transition-colors shrink-0"
              title="Create To-Do List"
            >
              <CheckSquare size={20} />
            </button>
            
            <textarea 
              rows={1}
              placeholder="Type a message..."
              className={`w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-textPrimary placeholder:text-textMuted text-sm outline-none max-h-32 custom-scrollbar ${isRecording ? 'hidden' : 'block'}`}
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            {isRecording && (
              <div className="w-full py-3 px-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                <span className="text-textPrimary text-sm font-mono">{formatDuration(recordingDuration)}</span>
                <span className="text-textMuted text-sm ml-auto animate-pulse">Recording audio...</span>
              </div>
            )}
          </div>
          
          {isRecording ? (
            <button 
              type="button" 
              onClick={stopRecording}
              className="bg-error text-white p-3.5 rounded-full hover:bg-opacity-90 transition-all shrink-0 shadow-lg animate-pulse"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (!newMessage.trim() && !selectedImage) ? (
            <button 
              type="button" 
              onClick={startRecording}
              className="bg-bgSecondary border border-borderBase text-textPrimary p-3.5 rounded-full hover:bg-bgCard hover:text-accent transition-all shrink-0 shadow-sm"
            >
              <Mic size={18} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="bg-bgSecondary border border-borderBase text-textPrimary p-3.5 rounded-full hover:bg-bgCard hover:text-accent transition-all shrink-0 shadow-sm"
                title="Schedule Message"
              >
                <CalendarClock size={18} />
              </button>
              <button 
                type="submit" 
                className="bg-accent text-white p-3.5 rounded-full hover:bg-opacity-90 transition-all shrink-0 shadow-lg"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </>
          )}
        </form>
      </div>

      {showScheduleModal && (
        <ScheduleMessageModal 
          onClose={() => setShowScheduleModal(false)}
          onSchedule={() => {
            setNewMessage('');
            setSelectedImage(null);
          }}
          conversationId={activeConversation._id}
          content={newMessage}
          type="text"
        />
      )}

      {showPollModal && (
        <CreatePollModal 
          onClose={() => setShowPollModal(false)}
          conversationId={activeConversation._id}
        />
      )}

      {showTodoModal && (
        <CreateTodoModal 
          onClose={() => setShowTodoModal(false)}
          conversationId={activeConversation._id}
        />
      )}
    </div>
  );
}
