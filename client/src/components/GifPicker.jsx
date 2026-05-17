import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TENOR_API_KEY = 'LIVDSRZULELA'; // Public dev key

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const fetchGifs = async () => {
      setLoading(true);
      try {
        const url = query.trim() 
          ? `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=20`
          : `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=20`;
          
        const res = await fetch(url);
        const data = await res.json();
        setGifs(data.results || []);
      } catch (error) {
        console.error('Failed to fetch GIFs:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchGifs, 500);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        ref={containerRef}
        className="absolute bottom-16 left-0 w-72 h-96 bg-bgSecondary border border-borderBase rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
      >
        <div className="p-3 border-b border-borderBase">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" size={16} />
            <input 
              type="text" 
              placeholder="Search GIFs..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-bgCard border border-borderBase rounded-xl py-2 pl-9 pr-3 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-accent" size={24} />
            </div>
          ) : gifs.length > 0 ? (
            <div className="columns-2 gap-2 space-y-2">
              {gifs.map(gif => (
                <img 
                  key={gif.id}
                  src={gif.media[0].tinygif.url}
                  alt={gif.content_description}
                  onClick={() => onSelect(gif.media[0].gif.url)}
                  className="w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-textMuted text-sm mt-10">
              No GIFs found
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
