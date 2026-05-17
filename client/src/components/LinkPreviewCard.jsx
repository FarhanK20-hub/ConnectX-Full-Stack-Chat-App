import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { ExternalLink } from 'lucide-react';

export default function LinkPreviewCard({ url, isOwn }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const { data } = await api.post('/preview', { url });
        if (data.title || data.image) {
          setPreview(data);
        }
      } catch (error) {
        console.error('Failed to load preview for URL:', url);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreview();
  }, [url]);

  if (loading) return null;
  if (!preview) return null;

  return (
    <a 
      href={preview.url || url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`block mt-2 rounded-xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg max-w-sm w-full ${
        isOwn 
          ? 'bg-black/20 border-white/10 hover:border-white/30 text-white' 
          : 'bg-bgSecondary border-borderBase hover:border-accent/50 text-textPrimary'
      }`}
    >
      {preview.image && (
        <div className="w-full h-32 overflow-hidden bg-black/40">
          <img 
            src={preview.image} 
            alt={preview.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      <div className="p-3">
        <h4 className="font-display font-medium text-sm line-clamp-1 flex items-center gap-1.5">
          {preview.title || preview.siteName || url}
          <ExternalLink size={12} className="opacity-50 shrink-0" />
        </h4>
        {preview.description && (
          <p className={`text-xs mt-1 line-clamp-2 ${isOwn ? 'text-white/70' : 'text-textMuted'}`}>
            {preview.description}
          </p>
        )}
        {preview.siteName && (
          <p className={`text-[10px] mt-2 uppercase tracking-wider font-semibold ${isOwn ? 'text-white/50' : 'text-textMuted/70'}`}>
            {preview.siteName}
          </p>
        )}
      </div>
    </a>
  );
}
