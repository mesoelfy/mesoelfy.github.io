import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { motion, AnimatePresence } from 'framer-motion';

const randomId = () => Math.floor(Math.random() * 899) + 100;

export const LiveArtGrid = () => {
  const { openModal } = useStore();
  const [slots, setSlots] = useState<number[]>([]);

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
    <div className="grid grid-cols-3 gap-1 w-full p-2 content-start">
      <AnimatePresence mode='popLayout'>
        {slots.map((id, index) => (
          <motion.button
            key={`${index}-${id}`}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            
            onClick={() => openModal('gallery')}
            onMouseEnter={() => AudioSystem.playHover()} // ADDED SFX
            
            className="w-full aspect-square relative bg-black/50 border border-elfy-green-dim/30 hover:border-elfy-yellow hover:shadow-[0_0_10px_rgba(247,210,119,0.2)] group overflow-hidden flex items-center justify-center rounded-[1px]"
          >
            <div className="absolute inset-0 bg-elfy-green/5 group-hover:bg-elfy-green/10 transition-colors" />
            
            <span className="relative z-10 text-[9px] font-mono text-elfy-green-dim group-hover:text-elfy-yellow transition-colors">
              IMG_{id}
            </span>

            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-elfy-green-dim/50 group-hover:border-elfy-yellow" />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
