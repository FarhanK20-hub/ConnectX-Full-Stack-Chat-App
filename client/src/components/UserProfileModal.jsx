import React from 'react';
import { X, MessageSquare, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfileModal({ user, onClose, onMessage, onCall }) {
  if (!user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-bgSecondary border border-borderBase rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {/* Header Cover */}
          <div className="h-32 bg-gradient-to-r from-accent to-purple-600 relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col items-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full border-4 border-bgSecondary bg-bgCard -mt-14 mb-4 shadow-xl overflow-hidden">
              <img 
                src={user.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="text-2xl font-display font-bold text-textPrimary mb-1 text-center">
              {user.name}
            </h2>
            <p className="text-sm text-textMuted mb-4">{user.email}</p>
            
            {user.bio && (
              <p className="text-center text-sm text-textPrimary bg-bgCard/50 p-4 rounded-2xl w-full mb-6 border border-borderBase">
                {user.bio}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-4 w-full justify-center">
              <button 
                onClick={onMessage}
                className="flex-1 bg-accent text-white py-3 rounded-xl hover:bg-opacity-90 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                <MessageSquare size={18} />
                Message
              </button>
              
              <button 
                onClick={() => onCall('audio')}
                className="w-12 h-12 bg-bgCard border border-borderBase text-textPrimary rounded-xl flex items-center justify-center hover:text-accent hover:border-accent transition-colors"
              >
                <Phone size={18} />
              </button>
              <button 
                onClick={() => onCall('video')}
                className="w-12 h-12 bg-bgCard border border-borderBase text-textPrimary rounded-xl flex items-center justify-center hover:text-accent hover:border-accent transition-colors"
              >
                <Video size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
