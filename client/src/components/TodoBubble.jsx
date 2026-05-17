import React, { useState } from 'react';
import { Check, CheckSquare } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/axios';

export default function TodoBubble({ message }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const todoData = message.todoData;

  if (!todoData || !todoData.items) return null;

  const handleToggle = async (index) => {
    if (loading) return;
    
    setLoading(true);
    try {
      await api.post(`/messages/${message._id}/todo/toggle`, { itemIndex: index });
    } catch (error) {
      console.error('Failed to toggle todo', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = todoData.items.filter(item => item.isCompleted).length;
  const totalCount = todoData.items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  return (
    <div className="flex flex-col gap-3 min-w-[250px] w-full max-w-sm">
      <div className="flex items-center gap-2 font-display font-medium text-base mb-1">
        <CheckSquare size={18} className="text-success" />
        {todoData.title}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-success transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-textMuted text-right mb-2 mt(-1)">
        {completedCount} / {totalCount} completed
      </div>
      
      <div className="space-y-1">
        {todoData.items.map((item, index) => (
          <div 
            key={index}
            onClick={() => handleToggle(index)}
            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              item.isCompleted 
                ? 'bg-success/5 hover:bg-success/10' 
                : 'hover:bg-black/10'
            }`}
          >
            <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
              item.isCompleted 
                ? 'bg-success border-success text-white' 
                : 'border-textMuted/50 bg-bgCard text-transparent'
            }`}>
              <Check size={14} className={item.isCompleted ? 'opacity-100' : 'opacity-0'} />
            </div>
            
            <div className="flex-1 flex flex-col">
              <span className={`text-sm transition-all ${
                item.isCompleted ? 'text-textMuted line-through' : 'text-textPrimary'
              }`}>
                {item.text}
              </span>
              {item.isCompleted && item.completedBy && (
                <span className="text-[10px] text-textMuted mt-0.5">
                  Completed by {item.completedBy.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
