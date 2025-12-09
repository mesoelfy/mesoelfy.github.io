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

  if (!isGameOver || isZenMode) return null;

  const handleClick = () => {
    setClicked(true);
    AudioSystem.playClick();
    
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
          // Z-30 is correct (behind Header z-40)
          className="fixed top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center group cursor-pointer"
        >
          {/* CONNECTOR LINE: Increased width and opacity for visibility */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 160 }} 
            transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
            className="w-[2px] bg-critical-red/80 absolute -top-64 left-1/2 -translate-x-1/2 shadow-[0_0_8px_#FF003C]"
          />

          {/* THE BOMB BUTTON */}
          <div className="relative p-1 border border-critical-red bg-black/90 backdrop-blur-md shadow-[0_0_20px_#FF003C] overflow-hidden group-hover:shadow-[0_0_40px_#FF003C] transition-shadow duration-300 z-10">
             
             <div className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FF003C 0, #FF003C 5px, transparent 5px, transparent 10px)' }} 
             />

             <div className="relative w-16 h-16 border border-critical-red/50 flex items-center justify-center bg-black hover:bg-critical-red transition-colors duration-300 group-hover:text-black text-critical-red">
                 <motion.div
                   animate={{ rotate: [0, -10, 10, 0] }}
                   transition={{ repeat: Infinity, duration: 0.3, repeatDelay: 2 }} 
                 >
                    <Bomb size={32} strokeWidth={2} />
                 </motion.div>
             </div>
          </div>

          {/* LABEL */}
          <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-critical-red/10 border border-critical-red/50 backdrop-blur-md z-10">
             <Skull size={10} className="text-critical-red animate-pulse" />
             <span className="text-[10px] font-mono font-black text-critical-red tracking-widest uppercase group-hover:text-white transition-colors">
                PURGE_SYSTEM
             </span>
             <Skull size={10} className="text-critical-red animate-pulse" />
          </div>
          
          <span className="text-[8px] text-critical-red/60 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            [ ENABLE_ZEN_MODE ]
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
