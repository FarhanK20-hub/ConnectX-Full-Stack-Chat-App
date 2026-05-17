import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useStoryStore } from '../store/useStoryStore';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/axios';

export default function StoryTray() {
  const { stories, fetchStories, setActiveStoryGroup } = useStoryStore();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleUploadStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await api.post('/stories', { mediaUrl: uploadRes.data.url, type: 'image' });
      // The socket event 'new_story' in Chat.jsx will handle appending it globally
    } catch (error) {
      console.error('Failed to upload story', error);
    }
  };

  return (
    <div className="w-full flex items-center gap-4 px-4 py-4 overflow-x-auto custom-scrollbar border-b border-borderBase">
      {/* Add Story Button */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-textMuted flex items-center justify-center bg-bgCard hover:border-accent hover:text-accent transition-colors">
          <Plus size={24} />
        </div>
        <span className="text-[10px] text-textMuted">Your Story</span>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleUploadStory} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Story Bubbles */}
      {stories.map((group) => {
        // Check if all stories in this group are viewed by current user
        const allViewed = group.stories.every(s => s.viewedBy.includes(user._id));
        
        return (
          <div 
            key={group.user._id} 
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
            onClick={() => setActiveStoryGroup(group)}
          >
            <div className={`p-[2px] rounded-full ${allViewed ? 'bg-borderBase' : 'bg-gradient-to-tr from-accent to-purple-500'}`}>
              <div className="w-[52px] h-[52px] rounded-full bg-bgSecondary border-2 border-bgSecondary overflow-hidden">
                <img 
                  src={group.user.avatar || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'} 
                  alt={group.user.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <span className="text-[10px] text-textPrimary truncate w-14 text-center">
              {group.user._id === user._id ? 'You' : group.user.name.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
