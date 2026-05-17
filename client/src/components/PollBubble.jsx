import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/axios';

export default function PollBubble({ message }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const pollData = message.pollData;

  if (!pollData || !pollData.options) return null;

  // Calculate total votes across all options
  const totalVotes = pollData.options.reduce((sum, option) => sum + option.votes.length, 0);

  const handleVote = async (index) => {
    // Prevent double clicking while loading
    if (loading) return;
    
    setLoading(true);
    try {
      await api.post(`/messages/${message._id}/vote`, { optionIndex: index });
      // Socket handles real-time update in useChatStore via poll_updated event
    } catch (error) {
      console.error('Failed to vote', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-w-[250px] w-full max-w-sm">
      <div className="font-display font-medium text-base mb-1">
        {pollData.question}
      </div>
      
      <div className="space-y-2">
        {pollData.options.map((option, index) => {
          const voteCount = option.votes.length;
          const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
          const hasVoted = option.votes.some(id => id === user._id || id?._id === user._id);
          
          return (
            <motion.div 
              key={index}
              onClick={() => handleVote(index)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative overflow-hidden rounded-xl border cursor-pointer transition-colors ${
                hasVoted 
                  ? 'border-accent bg-accent/5' 
                  : 'border-borderBase bg-bgSecondary hover:border-textMuted/30'
              }`}
            >
              {/* Progress Bar Background */}
              <motion.div 
                className={`absolute inset-0 z-0 ${hasVoted ? 'bg-accent/20' : 'bg-white/5'}`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    hasVoted ? 'border-accent bg-accent' : 'border-textMuted/50'
                  }`}>
                    {hasVoted && <Check size={12} className="text-white" />}
                  </div>
                  <span className={hasVoted ? 'text-textPrimary font-medium' : 'text-textMuted'}>
                    {option.text}
                  </span>
                </div>
                <div className="text-xs text-textMuted flex gap-2">
                  <span>{percentage}%</span>
                  <span>({voteCount})</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="text-xs text-textMuted text-right mt-1">
        Total votes: {totalVotes}
      </div>
    </div>
  );
}
