import { useEffect, useState, useRef, memo } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { PanelId } from '@/engine/config/PanelConfig';
import galleryRaw from '@/engine/config/static/gallery.json';

const GRID_SIZE = 12;

const SPEEDS = [
    { min: 4000, max: 4500 }, 
    { min: 5000, max: 5500 }, 
    { min: 6000, max: 6500 }
];

// HOISTED FUNCTIONS TO PREVENT RE-ALLOCATION ON RENDER
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

const ArtCell = memo(({ item, isDestroyed, onClick }: { item: any, isDestroyed: boolean, onClick: (id: string, e: React.MouseEvent) => void }) => {
    const key = item ? item.uniqueId : 'empty';
    const seed = item ? (item.uniqueId.charCodeAt(0) + item.uniqueId.charCodeAt(item.uniqueId.length - 1)) : 0;
    const duration = 1.2 + (seed % 6) * 0.1;

    return (
        <div className="relative w-full aspect-square bg-black/20 border-transparent overflow-hidden rounded-[1px]">
            <AnimatePresence mode="popLayout" initial={false}>
                {item ? (
                    <motion.button
                        key={key}
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        transition={{ duration: duration, ease: "easeInOut" }}
                        onClick={(e) => onClick(item.uniqueId, e)}
                        onMouseEnter={(e) => !isDestroyed && AudioSystem.playHover(getPan(e))}
                        className={clsx(
                            "absolute inset-0 w-full h-full group/tile border flex items-center justify-center transition-colors bg-black",
                            isDestroyed 
                                ? "border-critical-red/20 cursor-default" 
                                : "border-primary-green-dim/30 hover:border-alert-yellow hover:shadow-[0_0_15px_rgba(234,231,71,0.2)] cursor-pointer"
                        )}
                    >
                        <div className={clsx("absolute inset-0 transition-colors z-0", isDestroyed ? "bg-critical-red/5" : "bg-primary-green/5 group-hover/tile:bg-primary-green/10")} />
                        {!isDestroyed && (
                            <img 
                                src={item.thumb} alt={item.title} loading="lazy"
                                className="relative z-10 w-[95%] h-[95%] object-contain pointer-events-none drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] scale-110 group-hover/tile:scale-100 opacity-90 group-hover/tile:opacity-100 transition-all duration-300 ease-out"
                            />
                        )}
                        <div className="absolute top-0 left-0 z-20">
                            <div className={clsx("text-[8px] font-mono leading-none px-1.5 py-1 backdrop-blur-[2px] border-b border-r border-transparent transition-colors", isDestroyed ? "bg-critical-red/20 text-critical-red animate-pulse" : "bg-black/60 text-primary-green-dim group-hover/tile:text-alert-yellow")}>
                                {isDestroyed ? "ERR" : item.id}
                            </div>
                        </div>
                        {!isDestroyed && <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary-green-dim/50 group-hover/tile:border-alert-yellow z-20" />}
                    </motion.button>
                ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full bg-black/20" />
                )}
            </AnimatePresence>
        </div>
    );
});

ArtCell.displayName = "ArtCell";

export const LiveArtGrid = () => {
  const { openModal, setSelectedArtId } = useStore();
  const panelState = useGameStore((state) => state.panels[PanelId.ART]);
  const isDestroyed = panelState ? panelState.isDestroyed : false;
  
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  
  const deckRef = useRef<any[]>([]);
  const displayItemsRef = useRef<any[]>([]); 
  const nextUpdateTimesRef = useRef<number[]>([]);

  useEffect(() => {
      const fullDeck = shuffle([...galleryRaw]);
      const initialHand = fullDeck.splice(0, GRID_SIZE);
      
      deckRef.current = fullDeck;
      displayItemsRef.current = initialHand;
      
      nextUpdateTimesRef.current = Array.from({ length: GRID_SIZE }, () => {
          return Date.now() + 2000 + (Math.random() * 8000); 
      });
      
      setDisplayItems(initialHand);
  }, []);

  useEffect(() => {
      if (isDestroyed) return;

      const tick = setInterval(() => {
          const now = Date.now();
          const updates: { index: number, newItem: any }[] = [];
          const currentGrid = displayItemsRef.current;

          for (let i = 0; i < GRID_SIZE; i++) {
              if (now >= nextUpdateTimesRef.current[i]) {
                  if (deckRef.current.length === 0) {
                      const activeIds = new Set(currentGrid.map(item => item?.uniqueId).filter(Boolean));
                      const newDeck = galleryRaw.filter(item => !activeIds.has(item.uniqueId));
                      deckRef.current = shuffle(newDeck);
                  }

                  const nextCard = deckRef.current.pop();
                  
                  if (nextCard) {
                      currentGrid[i] = nextCard;
                      updates.push({ index: i, newItem: nextCard });
                      nextUpdateTimesRef.current[i] = getNextTime();
                  }
              }
          }

          if (updates.length > 0) {
              setDisplayItems([...currentGrid]);
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
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <ArtCell key={i} item={displayItems[i]} isDestroyed={isDestroyed} onClick={handleClick} />
        ))}
    </div>
  );
};
