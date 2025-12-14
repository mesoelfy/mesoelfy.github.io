import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/game/store/useGameStore';
import { Skull, Zap, Power, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { AudioSystem } from '@/engine/audio/AudioSystem';

interface IntelligentHeaderProps {
  title: string;
  health: number;
  maxHealth?: number; 
  isDestroyed: boolean;
  isGameOver: boolean;
  gameId?: string;
}

export const IntelligentHeader = ({ 
  title, 
  health, 
  maxHealth = 1000,
  isDestroyed, 
  isGameOver, 
  gameId 
}: IntelligentHeaderProps) => {
  const interactionTarget = useGameStore(state => state.interactionTarget);
  const isInteracting = gameId && interactionTarget === gameId;
  
  // Calculate percentage
  let rawPercent = (health / maxHealth) * 100;
  if (!Number.isFinite(rawPercent) || isNaN(rawPercent)) rawPercent = 0;
  const healthPercent = Math.max(0, Math.min(100, rawPercent));

  const isDamaged = !isDestroyed && healthPercent < 100;

  const [showOptimal, setShowOptimal] = useState(false);

  useEffect(() => {
    if (health < maxHealth) {
      setShowOptimal(true);
    }
    // Only play sound if we just healed to full
    if (health >= maxHealth && showOptimal) {
      AudioSystem.playSound('ui_optimal'); 
      const timer = setTimeout(() => setShowOptimal(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [health, showOptimal, maxHealth]);

  let mainColor = "text-primary-green";
  let statusText = "SECURE";
  
  if (isGameOver) {
      mainColor = "text-critical-red";
      statusText = "SYSTEM_FAILURE";
  } else if (isDestroyed) {
      // LOGIC UPDATE:
      // If interacting: Purple.
      // If NOT interacting (even if decaying): Red (Standard Offline State).
      if (isInteracting) {
          mainColor = "text-latent-purple";
          statusText = "REBOOTING...";
      } else {
          mainColor = "text-critical-red";
          statusText = "OFFLINE";
      }
  } else if (isInteracting && isDamaged) {
      mainColor = "text-service-cyan";
      statusText = "HEALING...";
  } else if (isDamaged) {
      mainColor = "text-alert-yellow"; 
      statusText = "ATTENTION_REQ";
  } else if (!showOptimal) {
      mainColor = "text-primary-green-dim";
      statusText = "ONLINE";
  }

  return (
    <div className={clsx(
        "relative flex flex-col border-b transition-colors duration-300 shrink-0 z-10",
        isGameOver ? "bg-critical-red/10 border-critical-red/50" :
        isDestroyed ? (
            isInteracting ? "bg-latent-purple/10 border-latent-purple/50" : 
            // If decaying but not interacting, we want the Red Border (Offline state)
            "bg-critical-red/10 border-critical-red/50" 
        ) :
        (isInteracting && isDamaged) ? "bg-service-cyan/10 border-service-cyan/50" :
        isDamaged ? "bg-alert-yellow/10 border-alert-yellow/30" : 
        "bg-primary-green/5 border-primary-green-dim/30"
    )}>
        <div className="flex items-center justify-between px-3 py-1.5 h-8">
            <div className="flex items-baseline gap-2">
                <span className={clsx("text-sm md:text-base font-header font-bold uppercase tracking-wider drop-shadow-md transition-colors duration-300", mainColor)}>
                    {title}
                </span>
                <span className={clsx("text-[8px] font-mono tracking-widest opacity-80", mainColor)}>
                    [{statusText}]
                </span>
            </div>

            <div className="w-5 h-5 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {isGameOver ? (
                        <motion.div 
                            key="gameover"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="text-critical-red drop-shadow-[0_0_8px_currentColor]"
                        >
                            <Skull size={16} />
                        </motion.div>
                    ) : isDestroyed ? (
                        isInteracting ? (
                            <motion.div 
                                key="rebooting"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 bg-latent-purple rounded-full flex items-center justify-center shadow-[0_0_10px_currentColor]"
                            >
                                <motion.div animate={{ rotate: 360, opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                    <Zap size={10} className="text-black fill-current" />
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="destroyed"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 border border-latent-purple rounded-full flex items-center justify-center opacity-80"
                            >
                                <Power size={10} className="text-latent-purple" />
                            </motion.div>
                        )
                    ) : isInteracting && isDamaged ? (
                        <motion.div 
                            key="healing"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 bg-service-cyan rounded-full flex items-center justify-center shadow-[0_0_10px_currentColor]"
                        >
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <RefreshCw size={10} className="text-black" />
                            </motion.div>
                        </motion.div>
                    ) : isDamaged ? (
                        <motion.div 
                            key="damaged"
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ 
                                x: [-2, 2, -2, 2, -2, 2, 0, 0, 0, 0, 0, 0, 0], 
                                filter: [
                                    'drop-shadow(0 0 0px rgba(234,231,71,0))',
                                    'drop-shadow(0 0 8px rgba(234,231,71,1))', 
                                    'drop-shadow(0 0 0px rgba(234,231,71,0))'
                                ]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="text-alert-yellow"
                        >
                            <AlertTriangle size={16} />
                        </motion.div>
                    ) : showOptimal ? (
                        <motion.div 
                            key="optimal"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="w-4 h-4 bg-primary-green rounded-full flex items-center justify-center shadow-[0_0_5px_currentColor]"
                        >
                            <Check size={10} className="text-black stroke-[3px]" />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>

        {!isGameOver && (
            <div className="w-full h-1 bg-black/50 relative overflow-hidden">
                <motion.div 
                    className={clsx(
                        "h-full transition-colors duration-200",
                        (isDestroyed && isInteracting) ? "bg-latent-purple shadow-[0_0_10px_#9E4EA5]" :
                        // LOGIC UPDATE: Bar remains PURPLE while draining, even if panel frame is Red
                        (isDestroyed && healthPercent > 0) ? "bg-latent-purple opacity-60" : 
                        isDestroyed ? "bg-transparent" : 
                        (isInteracting && isDamaged) ? "bg-service-cyan" :
                        isDamaged ? "bg-alert-yellow" : 
                        "bg-primary-green"
                    )}
                    initial={{ width: "100%" }}
                    animate={{ width: `${healthPercent}%` }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
                />
            </div>
        )}
    </div>
  );
};
