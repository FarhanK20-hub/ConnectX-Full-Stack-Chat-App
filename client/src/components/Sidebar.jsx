import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Settings, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import ConversationItem from './ConversationItem';
import UserProfileModal from './UserProfileModal';
import StoryTray from './StoryTray';
import VaultModal from './VaultModal';
import api from '../utils/axios';
import { useVaultStore } from '../store/useVaultStore';
import { Lock, Unlock } from 'lucide-react';

export default function Sidebar() {
  const { conversations } = useChatStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isVaultUnlocked, lockedConversations, showVaultModal, setShowVaultModal, setVaultUnlocked } = useVaultStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);

  // Initialize locked conversations from user on mount
  React.useEffect(() => {
    if (user?.lockedConversations) {
      useVaultStore.getState().setLockedConversations(user.lockedConversations);
    }
  }, [user]);

  React.useEffect(() => {
    if (globalSearch && searchQuery.trim()) {
      const fetchUsers = async () => {
        try {
          const { data } = await api.get(`/users/search?q=${searchQuery}`);
          setSearchResults(data);
        } catch (error) {
          console.error('Failed to search users', error);
        }
      };
      const debounce = setTimeout(fetchUsers, 500);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [globalSearch, searchQuery]);

  const handleCreateConversation = async (userId) => {
    try {
      const { data } = await api.post('/conversations', {
        isGroup: false,
        members: [userId]
      });
      setGlobalSearch(false);
      setSearchQuery('');
      
      // Update store
      useChatStore.getState().setConversations([data, ...useChatStore.getState().conversations.filter(c => c._id !== data._id)]);
      useChatStore.getState().setActiveConversation(data);
    } catch (error) {
      console.error('Failed to create conversation', error);
    }
  };

  const filteredConversations = conversations.filter(c => {
    // Vault Filtering
    const isLocked = lockedConversations.includes(c._id);
    if (isVaultUnlocked && !isLocked) return false;
    if (!isVaultUnlocked && isLocked) return false;

    // Search Filtering
    if (c.isGroup) return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const otherMember = c.members.find(m => m._id !== user._id);
    return otherMember?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full md:w-80 border-r border-borderBase bg-bgSecondary flex flex-col h-full relative">
      {showVaultModal && <VaultModal />}
      {/* Profile Modal */}
      {selectedUserForProfile && (
        <div className="absolute inset-0 z-50 fixed">
          <UserProfileModal 
            user={selectedUserForProfile} 
            onClose={() => setSelectedUserForProfile(null)} 
            onMessage={() => {
              setSelectedUserForProfile(null);
              handleCreateConversation(selectedUserForProfile._id);
            }}
            onCall={(type) => {
              setSelectedUserForProfile(null);
              // Calls from sidebar aren't directly supported unless active, 
              // but we handle via switching active conversation first
              handleCreateConversation(selectedUserForProfile._id);
              toast.error('Please start the call from the chat window');
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-borderBase">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-accent p-1.5 rounded-lg text-white">
              <MessageSquare size={20} />
            </div>
            <h1 className="text-xl font-display font-bold">ConnectX</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setGlobalSearch(!globalSearch);
                setSearchQuery('');
              }}
              className={`p-2 rounded-full hover:bg-bgCard transition-colors ${globalSearch ? 'text-accent bg-bgCard' : 'text-textMuted hover:text-textPrimary'}`}
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => {
                if (isVaultUnlocked) {
                  setVaultUnlocked(false);
                } else {
                  setShowVaultModal(true);
                }
              }}
              className={`p-2 rounded-full transition-colors ${isVaultUnlocked ? 'text-accent bg-bgCard' : 'hover:bg-bgCard text-textMuted hover:text-textPrimary'}`}
              title="Vault"
            >
              {isVaultUnlocked ? <Unlock size={20} /> : <Lock size={20} />}
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="p-2 rounded-full hover:bg-bgCard text-textMuted hover:text-textPrimary transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" size={18} />
          <input 
            type="text" 
            placeholder={globalSearch ? "Search all users..." : "Search conversations..."} 
            className="w-full bg-bgCard border border-borderBase rounded-full py-2 pl-10 pr-4 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Story Tray */}
      {!globalSearch && !searchQuery && <StoryTray />}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {globalSearch ? (
          searchResults.length > 0 ? (
            searchResults.map((u) => (
              <div 
                key={u._id}
                className="flex items-center gap-3 p-3 mx-2 rounded-xl transition-colors duration-200 hover:bg-bgCard group"
              >
                <img 
                  src={u.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
                  className="w-10 h-10 rounded-full object-cover cursor-pointer group-hover:border-2 border-accent transition-all" 
                  alt="" 
                  onClick={() => setSelectedUserForProfile(u)}
                />
                <div className="flex-1 cursor-pointer" onClick={() => handleCreateConversation(u._id)}>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-textMuted">{u.email}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-textMuted mt-10 px-4 text-sm">
              {searchQuery ? "No users found" : "Type to search users..."}
            </div>
          )
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conv, index) => (
            <motion.div
              key={conv._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <ConversationItem conversation={conv} />
            </motion.div>
          ))
        ) : (
          <div className="text-center text-textMuted mt-10 px-4">
            <p className="text-sm">No conversations found.</p>
          </div>
        )}
      </div>
      
      {/* User Mini Profile */}
      <div className="p-4 border-t border-borderBase bg-bgSecondary flex items-center gap-3 cursor-pointer hover:bg-bgCard transition-colors" onClick={() => navigate('/profile')}>
        <img 
          src={user?.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
          alt={user?.name} 
          className="w-10 h-10 rounded-full object-cover border border-borderBase"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-textPrimary truncate flex items-center gap-2">
            {user?.name}
          </h4>
          {user?.ghostMode ? (
            <p className="text-xs text-textMuted flex items-center gap-1 italic">
              <span className="w-2 h-2 bg-textMuted rounded-full block"></span>
              Ghost Mode 👻
            </p>
          ) : (
            <p className="text-xs text-success flex items-center gap-1">
              <span className="w-2 h-2 bg-success rounded-full block"></span>
              Online
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
