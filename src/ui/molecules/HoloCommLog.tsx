import { useEffect, useState, useRef, useCallback } from 'react';
import { ExternalLink, Radio, WifiOff } from 'lucide-react';
import { useGameStore } from '@/game/store/useGameStore';

const VIDEO_POOL = [
  "oLALHbB3iXU", "A1dnxXrpN-o", "elyXcwunIYA", 
  "bHUcvHx9zlA", "Eq6EYcpWB_c", "sJyWgks1ZtA", 
  "dFlDRhvM4L0", "Ku5fgOHy1JY", "8-91y7BJ8QA"
];

const OfflineStatic = () => (
  <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center border border-elfy-red/20 overflow-hidden w-full h-full">
    <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] opacity-20 bg-cover mix-blend-screen pointer-events-none" />
    <div className="relative z-10 animate-pulse text-elfy-red font-mono text-[10px] bg-black/80 px-2 py-1 flex items-center gap-2">
        <WifiOff size={12} />
        <span>SIGNAL_LOST</span>
    </div>
  </div>
);

const VideoSlot = ({ 
  slotIndex, 
  initialVideo, 
  getNextVideo,
  isOffline 
}: { 
  slotIndex: number, 
  initialVideo: string, 
  getNextVideo: () => string,
  isOffline: boolean
}) => {
  const [videoId, setVideoId] = useState(initialVideo);
  const [isMasked, setIsMasked] = useState(true);

  // When offline toggles off (repair), restore mask briefly
  useEffect(() => {
    if (!isOffline) {
        setIsMasked(true);
        const unmaskTimer = setTimeout(() => setIsMasked(false), 2000);
        return () => clearTimeout(unmaskTimer);
    }
  }, [isOffline]); 

  // Auto-rotate videos logic
  useEffect(() => {
    if (isOffline) return;
    const duration = 30000 + (Math.random() * 15000);
    const timer = setTimeout(() => {
      setIsMasked(true);
      setTimeout(() => {
        const next = getNextVideo();
        if (next) setVideoId(next);
        setTimeout(() => setIsMasked(false), 2000);
      }, 1000); 
    }, duration);
    return () => clearTimeout(timer);
  }, [videoId, getNextVideo, isOffline]);

  return (
    <div className="relative w-full aspect-video min-h-[140px] md:min-h-0 border border-elfy-red/30 bg-black overflow-hidden group/video hover:border-elfy-red hover:shadow-[0_0_15px_rgba(255,0,60,0.3)] transition-all">
      
      {/* 
         STRICT RENDER:
         If offline, ONLY render Static.
         If online, render Video + Overlays.
      */}
      {isOffline ? (
        <>
          <OfflineStatic />
          <div className="absolute bottom-1 right-1 z-[70] text-[8px] text-elfy-red font-mono bg-black/80 px-1 pointer-events-none">
             CAM_0{slotIndex + 1} [ERR]
          </div>
        </>
      ) : (
        <>
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

          <div className="absolute inset-0 z-30 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
          
          <div className={`absolute inset-0 z-40 transition-opacity duration-500 flex items-center justify-center pointer-events-none ${isMasked ? 'opacity-100 bg-black' : 'opacity-0 group-hover/video:opacity-100 bg-black/40'}`}>
             {isMasked ? (
                <div className="flex flex-col items-center">
                    <Radio className="text-elfy-red animate-pulse w-6 h-6 mb-2" />
                    <span className="text-[10px] font-mono text-elfy-red animate-pulse">ESTABLISHING_UPLINK...</span>
                </div>
             ) : (
                 <div className="flex items-center gap-2 text-elfy-red font-mono font-bold bg-black/80 px-3 py-1 border border-elfy-red rounded-sm pointer-events-auto">
                    <span>OPEN_SOURCE</span>
                    <ExternalLink size={12} />
                 </div>
             )}
          </div>
          
          {/* External Link Overlay */}
          {!isMasked && (
              <a 
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-50 cursor-pointer"
                aria-label="Watch on YouTube"
              />
          )}

          <div className="absolute bottom-1 right-1 z-[60] text-[8px] text-elfy-red font-mono bg-black/80 px-1 pointer-events-none">
             CAM_0{slotIndex + 1}
          </div>
        </>
      )}
    </div>
  );
};

export const HoloCommLog = () => {
  const deckRef = useRef<string[]>([...VIDEO_POOL]);
  
  // Access panel state
  const panelState = useGameStore((state) => state.panels['video']);
  const isOffline = panelState ? (panelState.isDestroyed || panelState.health <= 0) : false;
  
  const [initialVideos, setInitialVideos] = useState<string[] | null>(null);

  useEffect(() => {
    deckRef.current = [...VIDEO_POOL];
    const init: string[] = [];
    for(let i=0; i<3; i++) {
      const randomIndex = Math.floor(Math.random() * deckRef.current.length);
      const vid = deckRef.current[randomIndex];
      deckRef.current.splice(randomIndex, 1);
      init.push(vid);
    }
    setInitialVideos(init);
  }, []);

  const getNextVideo = useCallback(() => {
    if (deckRef.current.length === 0) deckRef.current = [...VIDEO_POOL];
    const randomIndex = Math.floor(Math.random() * deckRef.current.length);
    const selected = deckRef.current[randomIndex];
    deckRef.current.splice(randomIndex, 1);
    return selected || VIDEO_POOL[0];
  }, []);

  if (!initialVideos) return <div className="h-full bg-black" />;

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden p-1 justify-center">
      {initialVideos.map((vid, i) => (
        <VideoSlot 
          key={i} 
          slotIndex={i} 
          initialVideo={vid} 
          getNextVideo={getNextVideo}
          isOffline={isOffline} 
        />
      ))}
    </div>
  );
};
