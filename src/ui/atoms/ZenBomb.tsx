import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Skull } from 'lucide-react';
import { useGameStore } from '@/game/store/useGameStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useState } from 'react';

export const ZenBomb = () => {
  const isGameOver = useGameStore(state => state.systemIntegrity <= 0);
  const isZenMode = useGameStore(state => state.isZenMode);
  const activateZenMode = useGameStore(state => state.activateZenMode);
  const [clicked, setClicked] = useState(false);

  // Only show if Game Over AND NOT yet in Zen Mode
  if (!isGameOver || isZenMode) return null;

  const handleClick = () => {
    setClicked(true);
    AudioSystem.playClick();
    
    // Delay actual activation to let animation play
    setTimeout(() => {
        activateZenMode();
    }, 800);
  };

  return (
    <AnimatePresence>
      {!clicked && (
        <motion.button
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ scale: 3, opacity: 0, filter: "blur(20px)" }} 
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 1.0 }} 
          
          onClick={handleClick}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] flex flex-col items-center group cursor-pointer"
        >
          {/* CONNECTOR LINE (Longer and positioned higher to tuck behind header) */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 120 }} // Taller wire
            transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
            className="w-[1px] bg-elfy-red/50 absolute -top-32 left-1/2 -translate-x-1/2"
          />

          {/* THE BOMB BUTTON */}
          <div className="relative p-1 border border-elfy-red bg-black/90 backdrop-blur-md shadow-[0_0_20px_#FF003C] overflow-hidden group-hover:shadow-[0_0_40px_#FF003C] transition-shadow duration-300 z-10">
             
             {/* Hazard Stripes */}
             <div className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FF003C 0, #FF003C 5px, transparent 5px, transparent 10px)' }} 
             />

             {/* Inner Box */}
             <div className="relative w-16 h-16 border border-elfy-red/50 flex items-center justify-center bg-black hover:bg-elfy-red transition-colors duration-300 group-hover:text-black text-elfy-red">
                 <motion.div
                   animate={{ rotate: [0, -10, 10, 0] }}
                   transition={{ repeat: Infinity, duration: 0.3, repeatDelay: 2 }} // Panic shake
                 >
                    <Bomb size={32} strokeWidth={2} />
                 </motion.div>
             </div>
          </div>

          {/* LABEL (Increased spacing with mt-4) */}
          <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-elfy-red/10 border border-elfy-red/50 backdrop-blur-md z-10">
             <Skull size={10} className="text-elfy-red animate-pulse" />
             <span className="text-[10px] font-mono font-black text-elfy-red tracking-widest uppercase group-hover:text-white transition-colors">
                PURGE_SYSTEM
             </span>
             <Skull size={10} className="text-elfy-red animate-pulse" />
          </div>
          
          <span className="text-[8px] text-elfy-red/60 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            [ ENABLE_ZEN_MODE ]
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
