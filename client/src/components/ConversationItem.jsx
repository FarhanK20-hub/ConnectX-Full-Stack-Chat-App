import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';

export default function ConversationItem({ conversation }) {
  const { activeConversation, setActiveConversation, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  
  const isActive = activeConversation?._id === conversation._id;
  
  // Determine display name and avatar for 1-on-1 vs group
  let displayName = conversation.name;
  let displayAvatar = conversation.avatar;
  let isOnline = false;

  if (!conversation.isGroup) {
    const otherMember = conversation.members.find(m => m._id !== user._id);
    if (otherMember) {
      displayName = otherMember.name;
      displayAvatar = otherMember.avatar;
      isOnline = onlineUsers.has(otherMember._id) || otherMember.isOnline;
    }
  }

  // Fallback avatar
  if (!displayAvatar) {
    displayAvatar = 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
  }

  return (
    <div 
      onClick={() => setActiveConversation(conversation)}
      className={cn(
        "flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer transition-colors duration-200",
        isActive ? "bg-accentSoft" : "hover:bg-bgCard"
      )}
    >
      <div className="relative flex-shrink-0">
        <img 
          src={displayAvatar} 
          alt={displayName} 
          className="w-12 h-12 rounded-full object-cover border border-borderBase bg-bgCard"
        />
        {isOnline && !conversation.isGroup && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-bgSecondary rounded-full"></span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <h4 className="text-textPrimary font-medium truncate">{displayName}</h4>
            {!conversation.isGroup && conversation.streak?.count >= 3 && (
              <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-1 py-0.5 rounded flex items-center" title={`${conversation.streak.count} day streak!`}>
                🔥 {conversation.streak.count}
              </span>
            )}
          </div>
          {conversation.lastMessage && (
            <span className="text-[11px] text-textMuted flex-shrink-0">
              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          <p className="text-sm text-textMuted truncate flex-1">
            {conversation.lastMessage ? (
              conversation.lastMessage.type === 'image' ? '🖼️ Image' : conversation.lastMessage.content
            ) : (
              <span className="italic">No messages yet</span>
            )}
          </p>
          {/* Example of unread badge - mock for now */}
          {/* <span className="ml-2 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span> */}
        </div>
      </div>
    </div>
  );
}
