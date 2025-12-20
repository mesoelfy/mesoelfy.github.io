import { useEffect, useState } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { PanelId } from '@/engine/config/PanelConfig';

const randomId = () => Math.floor(Math.random() * 899) + 100;

export const LiveArtGrid = () => {
  const { openModal } = useStore();
  const [slots, setSlots] = useState<number[]>([]);
  const panelState = useGameStore((state) => state.panels[PanelId.ART]);
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
    <div className={clsx("grid grid-cols-3 gap-1 w-full p-2 content-start transition-opacity duration-500", isDestroyed ? "pointer-events-none opacity-80" : "")}>
      <AnimatePresence mode='popLayout'>
        {slots.map((id, index) => {
            const isCorrupt = isDestroyed;
            return (
              <motion.button
                key={`${index}-${id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                onClick={(e) => { if (isDestroyed) return; AudioSystem.playClick(getPan(e)); openModal('gallery'); }}
                onMouseEnter={(e) => !isDestroyed && AudioSystem.playHover(getPan(e))}
                className={clsx("w-full aspect-square relative border group overflow-hidden flex items-center justify-center rounded-[1px] transition-colors", isCorrupt ? "bg-black border-critical-red/20" : "bg-black/50 border-primary-green-dim/30 hover:border-alert-yellow hover:shadow-[0_0_10px_rgba(247,210,119,0.2)]")}
              >
                <div className={clsx("absolute inset-0 transition-colors", isCorrupt ? "bg-critical-red/5" : "bg-primary-green/5 group-hover:bg-primary-green/10")} />
                <span className={clsx("relative z-10 text-[9px] font-mono transition-colors", isCorrupt ? "text-critical-red/50 animate-pulse" : "text-primary-green-dim group-hover:text-alert-yellow")}>{isCorrupt ? (Math.random() > 0.5 ? "0x00" : "ERR") : `IMG_${id}`}</span>
                {!isCorrupt && <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-primary-green-dim/50 group-hover:border-alert-yellow" />}
              </motion.button>
            );
        })}
      </AnimatePresence>
    </div>
  );
};
