import { useState } from 'react';
import { motion } from 'framer-motion';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Crosshair } from 'lucide-react';

export const ActionButton = () => {
  const [pressed, setPressed] = useState(false);

  const handleDown = () => {
    setPressed(true);
    AudioSystem.playClick();
    // Future: Trigger GameEventBus.emit(GameEvents.PLAYER_ACTION, ...)
  };

  const handleUp = () => {
    setPressed(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[90] touch-none select-none">
      <motion.button
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
        animate={{ scale: pressed ? 0.9 : 1.0 }}
        className="w-24 h-24 rounded-full border-2 border-primary-green/50 bg-black/50 backdrop-blur-sm flex items-center justify-center relative group active:border-primary-green active:bg-primary-green/20 transition-colors"
      >
        {/* Inner Ring */}
        <div className="absolute inset-2 rounded-full border border-primary-green/20" />
        
        {/* Icon */}
        <Crosshair 
            size={32} 
            className={`text-primary-green transition-all duration-100 ${pressed ? 'scale-90 opacity-100' : 'opacity-80'}`} 
        />

        {/* Pulse Effect */}
        {pressed && (
            <motion.div 
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 rounded-full bg-primary-green"
            />
        )}
      </motion.button>
      
      <div className="absolute -top-6 w-full text-center text-[10px] text-primary-green/50 font-mono tracking-widest">
          [ ACT ]
      </div>
    </div>
  );
};
