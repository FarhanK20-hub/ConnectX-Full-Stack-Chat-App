import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStoryStore } from '../store/useStoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/axios';

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer() {
  const { activeStoryGroup, activeStoryIndex, nextStory, prevStory, setActiveStoryGroup } = useStoryStore();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!activeStoryGroup) return;

    // Reset progress when story changes
    setProgress(0);

    const currentStory = activeStoryGroup.stories[activeStoryIndex];
    if (currentStory) {
      // Mark as viewed
      api.post(`/stories/${currentStory._id}/view`).catch(console.error);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          nextStory();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeStoryGroup, activeStoryIndex, nextStory]);

  if (!activeStoryGroup) return null;

  const currentStory = activeStoryGroup.stories[activeStoryIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md h-full max-h-[850px] bg-bgSecondary overflow-hidden sm:rounded-[32px] sm:my-8 shadow-2xl border border-white/10"
        >
          {/* Progress Bars */}
          <div className="absolute top-4 inset-x-0 px-2 flex gap-1 z-20">
            {activeStoryGroup.stories.map((s, idx) => (
              <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{
                    width: idx === activeStoryIndex ? `${progress}%` : idx < activeStoryIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 inset-x-0 px-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <img 
                src={activeStoryGroup.user.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
                alt={activeStoryGroup.user.name}
                className="w-10 h-10 rounded-full border border-white/20 object-cover"
              />
              <span className="text-white font-medium text-sm drop-shadow-md">
                {activeStoryGroup.user.name}
              </span>
            </div>
            <button 
              onClick={() => setActiveStoryGroup(null)}
              className="text-white/80 hover:text-white p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Image */}
          <img 
            src={currentStory?.mediaUrl} 
            alt="Story" 
            className="w-full h-full object-cover"
          />

          {/* Tap Zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={prevStory} />
          <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={nextStory} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
