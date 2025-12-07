import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const randomId = () => Math.floor(Math.random() * 899) + 100;

export const LiveArtGrid = () => {
  const { openModal } = useStore();
  const [slots, setSlots] = useState<number[]>([]);
  
  const panelState = useGameStore((state) => state.panels['art']);
  const isDestroyed = panelState ? panelState.isDestroyed : false;

  useEffect(() => {
    setSlots(Array.from({ length: 12 }, randomId));

    const interval = setInterval(() => {
      setSlots(prev => {
        const newSlots = [...prev];
        const randomIndex = Math.floor(Math.random() * 12);
        newSlots[randomIndex] = randomId();
        return newSlots;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={clsx(
        "grid grid-cols-3 gap-1 w-full p-2 content-start transition-opacity duration-500",
        isDestroyed ? "pointer-events-none opacity-80" : ""
    )}>
      <AnimatePresence mode='popLayout'>
        {slots.map((id, index) => {
            const isCorrupt = isDestroyed;
            
            return (
              <motion.button
                key={`${index}-${id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                
                onClick={() => !isDestroyed && openModal('gallery')}
                onMouseEnter={() => !isDestroyed && AudioSystem.playHover()}
                
                className={clsx(
                    "w-full aspect-square relative border group overflow-hidden flex items-center justify-center rounded-[1px] transition-colors",
                    isCorrupt 
                        ? "bg-black border-elfy-red/20" 
                        : "bg-black/50 border-elfy-green-dim/30 hover:border-elfy-yellow hover:shadow-[0_0_10px_rgba(247,210,119,0.2)]"
                )}
              >
                <div className={clsx(
                    "absolute inset-0 transition-colors",
                    isCorrupt ? "bg-elfy-red/5" : "bg-elfy-green/5 group-hover:bg-elfy-green/10"
                )} />
                
                <span className={clsx(
                    "relative z-10 text-[9px] font-mono transition-colors",
                    isCorrupt ? "text-elfy-red/50 animate-pulse" : "text-elfy-green-dim group-hover:text-elfy-yellow"
                )}>
                  {isCorrupt ? (Math.random() > 0.5 ? "0x00" : "ERR") : `IMG_${id}`}
                </span>

                {!isCorrupt && (
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-elfy-green-dim/50 group-hover:border-elfy-yellow" />
                )}
              </motion.button>
            );
        })}
      </AnimatePresence>
    </div>
  );
};
