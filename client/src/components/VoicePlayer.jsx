import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VoicePlayer({ src, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex items-center gap-3 w-48 sm:w-64 p-1 ${isOwn ? 'text-white' : 'text-textPrimary'}`}>
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-accent/10 hover:bg-accent/20 text-accent'}`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
      </button>
      
      <div className="flex-1 relative h-8 flex items-center">
        {/* Animated Waveform CSS */}
        <div className="flex items-center gap-1 w-full justify-between h-5">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1 rounded-full ${isOwn ? 'bg-white/40' : 'bg-accent/40'} transition-all duration-150`}
              style={{
                height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '20%',
              }}
            />
          ))}
        </div>
        {/* Progress bar overlay */}
        <div className="absolute inset-0 flex items-center w-full">
            <div className={`h-[2px] rounded-full w-full ${isOwn ? 'bg-white/20' : 'bg-borderBase'}`}>
                <div 
                className={`h-full rounded-full ${isOwn ? 'bg-white' : 'bg-accent'}`} 
                style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                />
            </div>
        </div>
      </div>
      
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
