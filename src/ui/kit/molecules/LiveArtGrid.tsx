import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { PanelId } from '@/engine/config/PanelConfig';
import galleryRaw from '@/engine/config/static/gallery.json';

const GRID_SIZE = 12; // 3 Cols * 4 Rows

// THE THREE SPEED TIERS (Milliseconds)
// 4s, 5s, 6s ranges with slight variance to prevent robotic synchronization
const SPEEDS = [
    { min: 4000, max: 4500 }, 
    { min: 5000, max: 5500 }, 
    { min: 6000, max: 6500 }
];

export const LiveArtGrid = () => {
  const { openModal, setSelectedArtId } = useStore();
  const panelState = useGameStore((state) => state.panels[PanelId.ART]);
  const isDestroyed = panelState ? panelState.isDestroyed : false;
  
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  
  // -- STATE REFS --
  const deckRef = useRef<any[]>([]);
  const activeIdsRef = useRef<Set<string>>(new Set());
  const nextUpdateTimesRef = useRef<number[]>([]);

  // Helper: Shuffle
  const shuffle = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
  };

  const getNextTime = () => {
      const tier = SPEEDS[Math.floor(Math.random() * SPEEDS.length)];
      const duration = tier.min + Math.random() * (tier.max - tier.min);
      return Date.now() + duration;
  };

  // 1. Initialize
  useEffect(() => {
      const fullDeck = shuffle([...galleryRaw]);
      const initialHand = fullDeck.splice(0, GRID_SIZE);
      
      deckRef.current = fullDeck;
      activeIdsRef.current = new Set(initialHand.map(i => i.uniqueId));
      
      // Initialize timelines with a stagger
      nextUpdateTimesRef.current = Array.from({ length: GRID_SIZE }, () => {
          return Date.now() + 2000 + (Math.random() * 8000); 
      });
      
      setDisplayItems(initialHand);
  }, []);

  // 2. Independent Clock Watcher
  useEffect(() => {
      if (isDestroyed) return;

      const tick = setInterval(() => {
          const now = Date.now();
          const updates: { index: number, newItem: any }[] = [];

          for (let i = 0; i < GRID_SIZE; i++) {
              if (now >= nextUpdateTimesRef.current[i]) {
                  
                  if (deckRef.current.length === 0) {
                      const newDeck = galleryRaw.filter(item => !activeIdsRef.current.has(item.uniqueId));
                      deckRef.current = shuffle(newDeck);
                  }

                  const nextCard = deckRef.current.pop();
                  
                  if (nextCard) {
                      updates.push({ index: i, newItem: nextCard });
                      nextUpdateTimesRef.current[i] = getNextTime();
                  }
              }
          }

          if (updates.length > 0) {
              setDisplayItems(prev => {
                  const next = [...prev];
                  updates.forEach(u => {
                      const oldCard = next[u.index];
                      if (oldCard) activeIdsRef.current.delete(oldCard.uniqueId);
                      activeIdsRef.current.add(u.newItem.uniqueId);
                      next[u.index] = u.newItem;
                  });
                  return next;
              });
          }

      }, 200); 

      return () => clearInterval(tick);
  }, [isDestroyed]);

  const handleClick = (id: string, e: React.MouseEvent) => {
      if (isDestroyed) return;
      AudioSystem.playClick(getPan(e));
      setSelectedArtId(id);
      openModal('gallery');
  };

  return (
    <div className={clsx("grid grid-cols-3 gap-1 w-full p-2 content-start transition-opacity duration-500", isDestroyed ? "pointer-events-none opacity-50 grayscale" : "")}>
      <AnimatePresence mode='popLayout'>
        {displayItems.map((item, index) => {
            if (!item) return <div key={`empty-${index}`} className="w-full aspect-square bg-black/20" />;
            const isCorrupt = isDestroyed;
            const key = `${item.uniqueId}`; 
            
            // Randomized fade durations for organic feel
            const seed = item.uniqueId.charCodeAt(0) + item.uniqueId.charCodeAt(item.uniqueId.length - 1);
            const duration = 0.8 + (seed % 8) * 0.1;

            return (
              <motion.button
                key={key}
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                transition={{ duration: duration, ease: "circOut" }}
                onClick={(e) => handleClick(item.uniqueId, e)}
                onMouseEnter={(e) => !isDestroyed && AudioSystem.playHover(getPan(e))}
                className={clsx(
                    "group/tile w-full aspect-square relative border overflow-hidden flex items-center justify-center rounded-[1px] transition-colors bg-black",
                    isCorrupt ? "border-critical-red/20" : "border-primary-green-dim/30 hover:border-alert-yellow hover:shadow-[0_0_15px_rgba(234,231,71,0.2)]"
                )}
              >
                <div className={clsx("absolute inset-0 transition-colors z-0", isCorrupt ? "bg-critical-red/5" : "bg-primary-green/5 group-hover/tile:bg-primary-green/10")} />
                
                {!isCorrupt && (
                    <img 
                        src={item.thumb} 
                        alt={item.title}
                        className="relative z-10 w-[95%] h-[95%] object-contain pointer-events-none drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] scale-110 group-hover/tile:scale-100 opacity-90 group-hover/tile:opacity-100 transition-all duration-300 ease-out"
                        loading="lazy"
                    />
                )}

                <div className="absolute top-0 left-0 z-20">
                    <div className={clsx("text-[8px] font-mono leading-none px-1.5 py-1 backdrop-blur-[2px] border-b border-r border-transparent transition-colors", isCorrupt ? "bg-critical-red/20 text-critical-red animate-pulse" : "bg-black/60 text-primary-green-dim group-hover/tile:text-alert-yellow")}>
                        {isCorrupt ? "ERR" : item.id}
                    </div>
                </div>

                {!isCorrupt && <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary-green-dim/50 group-hover/tile:border-alert-yellow z-20" />}
              </motion.button>
            );
        })}
      </AnimatePresence>
    </div>
  );
};
