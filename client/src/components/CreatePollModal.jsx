import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BarChart2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axios';

export default function CreatePollModal({ onClose, conversationId }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length >= 6) {
      toast.error('Maximum 6 options allowed');
      return;
    }
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(o => o);
    if (validOptions.length < 2) {
      toast.error('Please provide at least two valid options');
      return;
    }

    // Format for backend
    const pollData = {
      question: question.trim(),
      options: validOptions.map(text => ({ text, votes: [] }))
    };

    setLoading(true);
    try {
      await api.post('/messages', {
        conversationId,
        type: 'poll',
        content: question.trim(), // fallback content
        pollData
      });
      
      toast.success('Poll created successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create poll');
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
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
              <BarChart2 size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-display font-medium text-textPrimary leading-tight">Create Poll</h2>
              <p className="text-xs text-textMuted">Ask a question and get votes</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-bgSecondary border border-borderBase rounded-xl py-3 px-4 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-textMuted"
                required
              />
            </div>
            
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 relative">
                  <input 
                    type="text" 
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full bg-bgSecondary border border-borderBase rounded-xl py-2.5 px-4 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-textMuted text-sm"
                    required={index < 2} // first two are required
                  />
                  {options.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => removeOption(index)}
                      className="absolute right-2 p-1.5 text-textMuted hover:text-error transition-colors bg-bgSecondary rounded-full"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button 
                type="button" 
                onClick={addOption}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-borderBase text-textMuted hover:text-accent hover:border-accent transition-all text-sm font-medium"
              >
                <Plus size={16} />
                Add Option
              </button>
            )}
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-accent hover:bg-opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
