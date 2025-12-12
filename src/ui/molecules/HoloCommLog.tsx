import { useEffect, useState, useRef, useCallback } from 'react';
import { ExternalLink, Radio, WifiOff, BatteryWarning } from 'lucide-react';
import { useGameStore } from '@/game/store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';

const VIDEO_POOL = [
  "oLALHbB3iXU", "A1dnxXrpN-o", "elyXcwunIYA", 
  "bHUcvHx9zlA", "Eq6EYcpWB_c", "sJyWgks1ZtA", 
  "dFlDRhvM4L0", "Ku5fgOHy1JY", "8-91y7BJ8QA"
];

const OfflineStatic = () => (
  <div className="absolute inset-0 z-[50] bg-black flex flex-col items-center justify-center border border-critical-red/20 overflow-hidden w-full h-full">
    <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] opacity-40 bg-cover mix-blend-screen pointer-events-none" />
    <div className="relative z-10 animate-pulse text-critical-red font-mono text-[10px] bg-black/80 px-2 py-1 flex items-center gap-2">
        <WifiOff size={12} />
        <span>SIGNAL_LOST</span>
    </div>
  </div>
);

const PowerSaveStatic = () => (
  <div className="absolute inset-0 z-[50] bg-black flex flex-col items-center justify-center border border-alert-yellow/20 overflow-hidden w-full h-full">
    {/* Simple scanline, no gif */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />
    
    <div className="relative z-10 flex flex-col items-center gap-2 text-alert-yellow opacity-80">
        <BatteryWarning size={24} />
        <span className="font-header font-bold text-xs tracking-widest">POWER_SAVE_MODE</span>
        <span className="font-mono text-[9px] opacity-60">VIDEO_FEED_DISABLED</span>
    </div>
  </div>
);

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

  const panelState = useGameStore((state) => state.panels['video']);
  const isOffline = panelState ? (panelState.isDestroyed || panelState.health <= 0) : false;
  
  // PERFORMANCE MODE CHECK
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isPotato = graphicsMode === 'POTATO';
  
  const prevOffline = useRef(isOffline);

  useEffect(() => {
    if (isOffline && !prevOffline.current) {
        setIsMasked(true); 
    }
    
    if (!isOffline && prevOffline.current) {
        setVideoId(getNextVideo()); 
        setIsMasked(true); 
        
        const t = setTimeout(() => setIsMasked(false), 2000);
        
        prevOffline.current = isOffline;
        return () => clearTimeout(t);
    }

    if (!isOffline && isMasked) {
         const t = setTimeout(() => setIsMasked(false), 2000);
         return () => clearTimeout(t);
    }
    
    prevOffline.current = isOffline;
  }, [isOffline, getNextVideo]);

  useEffect(() => {
    if (isOffline) return; 

    // Don't run rotate timer if in potato mode (save logic cycles)
    if (isPotato) return;

    const duration = 30000 + (Math.random() * 15000);
    
    const rotateTimer = setTimeout(() => {
      setIsMasked(true);
      
      const swapTimer = setTimeout(() => {
        setVideoId(getNextVideo());
        
        const unmaskTimer = setTimeout(() => {
            setIsMasked(false);
        }, 2000);
        
        return () => clearTimeout(unmaskTimer);
      }, 1000); 
      
      return () => clearTimeout(swapTimer);
    }, duration);

    return () => clearTimeout(rotateTimer);
  }, [videoId, isOffline, getNextVideo, isPotato]);

  return (
    <div 
        className="relative w-full aspect-video min-h-[140px] md:min-h-0 border border-primary-green-dim/30 bg-black overflow-hidden group/video hover:border-alert-yellow hover:shadow-[0_0_15px_rgba(234,231,71,0.3)] transition-all"
        onMouseEnter={() => !isOffline && AudioSystem.playHover()}
    >
      
      {isOffline ? (
          <OfflineStatic />
      ) : isPotato ? (
          <PowerSaveStatic />
      ) : (
        <>
          <div className="absolute inset-0 z-10">
            <iframe 
              key={videoId} 
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
                    <Radio className="text-primary-green animate-pulse w-6 h-6 mb-2" />
                    <span className="text-[10px] font-mono text-primary-green animate-pulse">ESTABLISHING_UPLINK...</span>
                </div>
             ) : (
                 <div className="flex items-center gap-2 text-alert-yellow font-mono font-bold bg-black/80 px-3 py-1 border border-alert-yellow rounded-sm pointer-events-auto">
                    <span>OPEN_SOURCE</span>
                    <ExternalLink size={12} />
                 </div>
             )}
          </div>
          
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-50 cursor-pointer"
            aria-label="Watch on YouTube"
            onClick={() => AudioSystem.playClick()}
          />

          <div className="absolute bottom-1 right-1 z-[60] text-[8px] text-primary-green font-mono bg-black/80 px-1 pointer-events-none group-hover/video:text-alert-yellow transition-colors">
             CAM_0{slotIndex + 1}
          </div>
        </>
      )}
      
      {isOffline && (
          <div className="absolute bottom-1 right-1 z-[60] text-[8px] text-critical-red font-mono bg-black/80 px-1 pointer-events-none">
             CAM_0{slotIndex + 1} [ERR]
          </div>
      )}
    </div>
  );
};

export const HoloCommLog = () => {
  const deckRef = useRef<string[]>([...VIDEO_POOL]);
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
        />
      ))}
    </div>
  );
};
