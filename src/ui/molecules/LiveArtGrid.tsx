import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const randomId = () => Math.floor(Math.random() * 899) + 100;

export const LiveArtGrid = () => {
  const { openModal } = useStore();
  const [slots, setSlots] = useState<number[]>([]);

  useEffect(() => {
    setSlots(Array.from({ length: 9 }, randomId));

    const interval = setInterval(() => {
      setSlots(prev => {
        const newSlots = [...prev];
        const randomIndex = Math.floor(Math.random() * 9);
        newSlots[randomIndex] = randomId();
        return newSlots;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    // FIX: Removed 'h-full' and 'grid-rows-3'. 
    // Now the grid grows vertically based on the width of the squares.
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
            // FIX: Added 'aspect-square'. This forces perfect 1:1 ratio.
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
