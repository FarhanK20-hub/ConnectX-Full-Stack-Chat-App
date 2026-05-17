import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckSquare, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axios';

export default function CreateTodoModal({ onClose, conversationId }) {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState(['', '']); // Start with 2 empty items
  const [loading, setLoading] = useState(false);

  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const addItem = () => {
    if (items.length >= 10) {
      toast.error('Maximum 10 items allowed');
      return;
    }
    setItems([...items, '']);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const validItems = items.map(o => o.trim()).filter(o => o);
    if (validItems.length === 0) {
      toast.error('Please provide at least one valid item');
      return;
    }

    const todoData = {
      title: title.trim(),
      items: validItems.map(text => ({ text, isCompleted: false, completedBy: null }))
    };

    setLoading(true);
    try {
      await api.post('/messages', {
        conversationId,
        type: 'todo',
        content: title.trim(),
        todoData
      });
      
      toast.success('To-Do list created successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-bgCard rounded-[24px] shadow-2xl border border-borderBase overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-textMuted hover:text-white bg-bgSecondary hover:bg-borderBase rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center border border-success/20">
              <CheckSquare size={24} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-display font-medium text-textPrimary leading-tight">Create To-Do List</h2>
              <p className="text-xs text-textMuted">A collaborative list for the group</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
            <div>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="List title (e.g. Project Tasks)"
                className="w-full bg-bgSecondary border border-borderBase rounded-xl py-3 px-4 text-white focus:border-success focus:ring-1 focus:ring-success outline-none transition-all placeholder:text-textMuted font-medium"
                required
              />
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 relative">
                  <div className="w-5 h-5 rounded border border-borderBase flex-shrink-0 bg-bgCard" />
                  <input 
                    type="text" 
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder={`Task ${index + 1}`}
                    className="w-full bg-transparent border-b border-borderBase py-2 px-1 text-white focus:border-success outline-none transition-all placeholder:text-textMuted text-sm"
                    required={index === 0}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-textMuted hover:text-error transition-colors rounded-full shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {items.length < 10 && (
              <button 
                type="button" 
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-borderBase text-textMuted hover:text-success hover:border-success transition-all text-sm font-medium"
              >
                <Plus size={16} />
                Add Item
              </button>
            )}
            
            <div className="pt-2 sticky bottom-0 bg-bgCard">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-success hover:bg-opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Share List'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
