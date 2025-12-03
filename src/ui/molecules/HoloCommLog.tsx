import { useEffect, useState, useRef, useCallback } from 'react';
import { ExternalLink, Radio } from 'lucide-react';

const VIDEO_POOL = [
  "oLALHbB3iXU", "A1dnxXrpN-o", "elyXcwunIYA", 
  "bHUcvHx9zlA", "Eq6EYcpWB_c", "sJyWgks1ZtA", 
  "dFlDRhvM4L0", "Ku5fgOHy1JY", "8-91y7BJ8QA"
];

const VideoSlot = ({ 
  slotIndex, 
  initialVideo, 
  getNextVideo 
}: { 
  slotIndex: number, 
  initialVideo: string, 
  getNextVideo: () => string 
}) => {
  const [videoId, setVideoId] = useState(initialVideo);
  const [isMasked, setIsMasked] = useState(true);

  useEffect(() => {
    setIsMasked(true);
    const unmaskTimer = setTimeout(() => {
      setIsMasked(false);
    }, 5000);
    return () => clearTimeout(unmaskTimer);
  }, []); 

  useEffect(() => {
    const duration = 30000 + (Math.random() * 15000);

    const timer = setTimeout(() => {
      setIsMasked(true);

      setTimeout(() => {
        const next = getNextVideo();
        if (next) setVideoId(next);

        setTimeout(() => {
          setIsMasked(false);
        }, 5000);

      }, 1000); 

    }, duration);

    return () => clearTimeout(timer);
  }, [videoId, getNextVideo]);

  return (
    // FIX: Added 'aspect-video' to force 16:9 ratio.
    // 'w-full' ensures it fills width, height adjusts automatically.
    // 'min-h-[140px]' is a safety fallback for mobile.
    <div className="relative w-full aspect-video min-h-[140px] md:min-h-0 border border-elfy-red/30 bg-black overflow-hidden group hover:border-elfy-red hover:shadow-[0_0_15px_rgba(255,0,60,0.3)] transition-all">
      <div className="absolute inset-0 z-30 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      
      <a 
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-40 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]"
      >
        <div className="flex items-center gap-2 text-elfy-red font-mono font-bold bg-black/80 px-3 py-1 border border-elfy-red rounded-sm">
          <span>OPEN_SOURCE</span>
          <ExternalLink size={12} />
        </div>
      </a>

      {/* THE MASK */}
      <div 
        className={`absolute inset-0 z-20 bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${isMasked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <Radio className="text-elfy-red animate-pulse w-6 h-6 mb-2" />
        <span className="text-[10px] font-mono text-elfy-red animate-pulse">ESTABLISHING_UPLINK...</span>
      </div>

      {/* YOUTUBE IFRAME */}
      <div className="absolute inset-0 z-10">
        <iframe 
          width="100%" 
          height="100%" 
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${videoId}&vq=small`} 
          title="HOLO_COMM" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <div className="absolute bottom-1 right-1 z-30 text-[8px] text-elfy-red font-mono bg-black/80 px-1">
         CAM_0{slotIndex + 1}
      </div>
    </div>
  );
};

export const HoloCommLog = () => {
  const deckRef = useRef<string[]>([...VIDEO_POOL]);

  const [initialVideos] = useState(() => {
    const init: string[] = [];
    for(let i=0; i<3; i++) {
      const randomIndex = Math.floor(Math.random() * deckRef.current.length);
      const vid = deckRef.current[randomIndex];
      deckRef.current.splice(randomIndex, 1);
      init.push(vid);
    }
    return init;
  });

  const getNextVideo = useCallback(() => {
    if (deckRef.current.length === 0) {
      deckRef.current = [...VIDEO_POOL];
    }
    const randomIndex = Math.floor(Math.random() * deckRef.current.length);
    const selected = deckRef.current[randomIndex];
    deckRef.current.splice(randomIndex, 1);
    return selected || VIDEO_POOL[0];
  }, []);

  return (
    // FIX: Using 'justify-center' to vertically center them if there's extra space
    <div className="flex flex-col h-full gap-2 overflow-hidden p-1 justify-center">
      {initialVideos.map((vid, i) => (
        <VideoSlot 
          key={i} 
          slotIndex={i} 
          initialVideo={vid} 
          getNextVideo={getNextVideo} 
        />
      ))}
    </div>
  );
};
