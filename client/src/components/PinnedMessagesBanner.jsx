import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../utils/axios';

export default function PinnedMessagesBanner({ conversation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!conversation?.pinnedMessages || conversation.pinnedMessages.length === 0) {
    return null;
  }

  const pinnedMessages = conversation.pinnedMessages;
  const currentPin = pinnedMessages[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  const handleUnpin = async () => {
    try {
      await api.post(`/conversations/${conversation._id}/pin/${currentPin._id}`);
      // Decrement index if we remove the last one
      if (currentIndex === pinnedMessages.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      console.error('Failed to unpin', error);
    }
  };

  return (
    <div className="bg-bgCard border-b border-borderBase px-4 py-2 flex items-center gap-3 shadow-sm z-10 relative">
      <div className="text-accent">
        <Pin size={18} className="fill-current" />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPin._id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            <span className="text-xs font-medium text-accent">
              Pinned Message
              {pinnedMessages.length > 1 && ` (${currentIndex + 1}/${pinnedMessages.length})`}
            </span>
            <span className="text-sm text-textPrimary truncate">
              {currentPin.type === 'text' ? currentPin.content : 
               currentPin.type === 'image' ? '📸 Image' : 
               currentPin.type === 'audio' ? '🎤 Voice Message' : 
               currentPin.type === 'poll' ? '📊 Poll' : 
               currentPin.type === 'todo' ? '✅ To-Do List' : 
               'Pinned Message'}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1">
        {pinnedMessages.length > 1 && (
          <>
            <button onClick={handlePrev} className="p-1 text-textMuted hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNext} className="p-1 text-textMuted hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </>
        )}
        <button onClick={handleUnpin} className="p-1 ml-2 text-textMuted hover:text-error transition-colors" title="Unpin">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
