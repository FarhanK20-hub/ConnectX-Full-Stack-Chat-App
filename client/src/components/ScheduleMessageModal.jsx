import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axios';
import { format, addMinutes } from 'date-fns';

export default function ScheduleMessageModal({ onClose, onSchedule, conversationId, content, type }) {
  // Default to 5 minutes from now
  const [scheduledAt, setScheduledAt] = useState(
    format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:mm")
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scheduledDate = new Date(scheduledAt);
    
    if (scheduledDate <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    setLoading(true);
    try {
      await api.post('/schedule', {
        conversationId,
        content,
        type,
        scheduledAt: scheduledDate.toISOString()
      });
      
      toast.success('Message scheduled successfully!');
      onSchedule(); // Callback to clear input and close modal
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-bgCard rounded-[24px] shadow-2xl border border-borderBase overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-textMuted hover:text-white bg-bgSecondary hover:bg-borderBase rounded-full transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
            <CalendarClock size={32} className="text-accent" />
          </div>
          
          <h2 className="text-xl font-display font-medium text-textPrimary mb-2">
            Schedule Message
          </h2>
          <p className="text-sm text-textMuted mb-6">
            Choose when you want this message to be sent automatically.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <label className="block text-sm font-medium text-textMuted mb-2">
                Date & Time
              </label>
              <input 
                type="datetime-local" 
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                className="w-full bg-bgSecondary border border-borderBase rounded-xl py-3 px-4 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-accent hover:bg-opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Send'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
