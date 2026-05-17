import React, { useRef, useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/axios';

export default function StickerPicker({ onSendSticker, onClose, conversation }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const customStickers = conversation?.customStickers || [];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await api.post(`/conversations/${conversation._id}/stickers`, {
        url: uploadData.url
      });

      toast.success('Sticker added to pack!');
    } catch (error) {
      toast.error('Failed to upload sticker');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="absolute bottom-full mb-2 left-0 w-72 bg-bgSecondary border border-borderBase rounded-xl shadow-xl p-3 z-50">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-textPrimary">
          {conversation?.isGroup ? 'Group Stickers' : 'Custom Stickers'}
        </h4>
        <button onClick={onClose} className="text-textMuted hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar p-1">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square bg-bgCard border border-dashed border-borderBase hover:border-accent hover:text-accent text-textMuted rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
        >
          {uploading ? (
            <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : (
            <>
              <Plus size={20} />
              <span className="text-[10px] font-medium">Add</span>
            </>
          )}
        </button>
        
        {customStickers.map((sticker, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSendSticker(sticker.url)}
            className="aspect-square bg-bgCard rounded-xl overflow-hidden hover:ring-2 hover:ring-accent transition-all group relative"
          >
            <img src={sticker.url} alt="Sticker" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">Send</span>
            </div>
          </motion.button>
        ))}
        
        {customStickers.length === 0 && !uploading && (
          <div className="col-span-2 aspect-square flex items-center justify-center text-xs text-textMuted text-center p-2">
            Upload images to create your custom sticker pack!
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
