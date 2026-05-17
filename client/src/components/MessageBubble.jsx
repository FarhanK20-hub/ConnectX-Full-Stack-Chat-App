import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Trash2, Pin } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';
import api from '../utils/axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoicePlayer from './VoicePlayer';
import LinkPreviewCard from './LinkPreviewCard';
import PollBubble from './PollBubble';
import TodoBubble from './TodoBubble';

export default function MessageBubble({ message }) {
  const { user } = useAuthStore();
  const isOwn = message.sender._id === user._id;

  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const urls = message.type === 'text' && !message.isDeleted ? extractUrls(message.content) : [];

  const handleDelete = async () => {
    try {
      await api.delete(`/messages/${message._id}`);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handlePin = async () => {
    try {
      await api.post(`/conversations/${message.conversationId}/pin/${message._id}`);
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-4",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[70%] gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar for others */}
        {!isOwn && (
          <img 
            src={message.sender.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
            alt={message.sender.name}
            className="w-8 h-8 rounded-full self-end border border-borderBase bg-bgCard"
          />
        )}

        <div className={cn(
          "flex flex-col",
          isOwn ? "items-end" : "items-start"
        )}>
          {!isOwn && (
            <span className="text-xs text-textMuted ml-1 mb-1">{message.sender.name}</span>
          )}
          
          <div className={cn(
            "relative group px-4 py-2.5 rounded-2xl shadow-sm",
            message.type === 'sticker' ? "bg-transparent p-0 max-w-[200px]" :
            isOwn 
              ? "bg-accent text-white rounded-br-none" 
              : "bg-bgCard border border-borderBase text-textPrimary rounded-bl-none",
            message.isDeleted && "italic opacity-70 text-textMuted bg-transparent border border-borderBase !text-textMuted"
          )}>
            {isOwn && !message.isDeleted && (
              <button 
                onClick={handleDelete}
                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-textMuted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity bg-bgSecondary rounded-full border border-borderBase shadow-sm"
                title="Delete message"
              >
                <Trash2 size={14} />
              </button>
            )}

            {!message.isDeleted && (
              <button 
                onClick={handlePin}
                className={`absolute ${isOwn ? '-left-16' : '-right-8'} top-1/2 -translate-y-1/2 p-1.5 text-textMuted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity bg-bgSecondary rounded-full border border-borderBase shadow-sm`}
                title="Pin message"
              >
                <Pin size={14} />
              </button>
            )}
            
            {message.type === 'poll' ? (
              <PollBubble message={message} />
            ) : message.type === 'todo' ? (
              <TodoBubble message={message} />
            ) : message.type === 'text' ? (
              <div className={cn(
                "markdown-content text-sm leading-relaxed break-words",
                isOwn ? "prose-invert" : ""
              )}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : message.type === 'audio' ? (
              <VoicePlayer src={message.content} isOwn={isOwn} />
            ) : message.type === 'sticker' ? (
              <img src={message.content} alt="Sticker" className="w-48 h-48 object-contain drop-shadow-xl" />
            ) : (
              <img src={message.content} alt="Attachment" className="max-w-full rounded-lg" />
            )}

            {urls.map((url, i) => (
              <LinkPreviewCard key={i} url={url} isOwn={isOwn} />
            ))}
          </div>
          
          {/* Metadata */}
          <div className="flex items-center gap-1 mt-1 text-[10px] text-textMuted">
            <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
            {isOwn && !message.isDeleted && (
              <span className="text-accent ml-1">
                {message.readBy?.length > 1 ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
