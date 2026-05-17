import { create } from 'zustand';
import api from '../utils/axios';

export const useStoryStore = create((set, get) => ({
  stories: [],
  activeStoryGroup: null, // The user group currently being viewed
  activeStoryIndex: 0,
  
  fetchStories: async () => {
    try {
      const { data } = await api.get('/stories');
      set({ stories: data });
    } catch (error) {
      console.error('Failed to fetch stories', error);
    }
  },

  addStory: (story) => {
    set((state) => {
      const updatedStories = [...state.stories];
      const userGroupIndex = updatedStories.findIndex(g => g.user._id === story.userId._id);
      
      if (userGroupIndex !== -1) {
        updatedStories[userGroupIndex].stories.push(story);
      } else {
        updatedStories.push({
          user: story.userId,
          stories: [story]
        });
      }
      return { stories: updatedStories };
    });
  },

  setActiveStoryGroup: (group) => set({ activeStoryGroup: group, activeStoryIndex: 0 }),
  
  nextStory: () => {
    const { activeStoryGroup, activeStoryIndex, stories, setActiveStoryGroup } = get();
    if (!activeStoryGroup) return;

    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      // Next story in same group
      set({ activeStoryIndex: activeStoryIndex + 1 });
    } else {
      // Move to next user's stories
      const currentGroupIndex = stories.findIndex(g => g.user._id === activeStoryGroup.user._id);
      if (currentGroupIndex !== -1 && currentGroupIndex < stories.length - 1) {
        setActiveStoryGroup(stories[currentGroupIndex + 1]);
      } else {
        // End of all stories
        setActiveStoryGroup(null);
      }
    }
  },

  prevStory: () => {
    const { activeStoryGroup, activeStoryIndex, stories, setActiveStoryGroup } = get();
    if (!activeStoryGroup) return;

    if (activeStoryIndex > 0) {
      // Previous story in same group
      set({ activeStoryIndex: activeStoryIndex - 1 });
    } else {
      // Move to previous user's stories
      const currentGroupIndex = stories.findIndex(g => g.user._id === activeStoryGroup.user._id);
      if (currentGroupIndex > 0) {
        const prevGroup = stories[currentGroupIndex - 1];
        set({ 
          activeStoryGroup: prevGroup, 
          activeStoryIndex: prevGroup.stories.length - 1 
        });
      } else {
        // Exit
        setActiveStoryGroup(null);
      }
    }
  }
}));
