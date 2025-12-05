import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { usePanelRegistry } from '@/game/hooks/usePanelRegistry';
import { useGameStore } from '@/game/store/useGameStore';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  gameId?: string; 
  suppressOfflineOverlay?: boolean;
}

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  shattered: (custom: number) => ({
    // FIX: Reduced Y fall distance (was 1000)
    // Randomize slightly so they don't form a perfect line
    y: 350 + (custom * 50), 
    opacity: 0.8, // Keep them visible
    rotate: custom * 15, 
    transition: { 
        duration: 1.5, 
        ease: "anticipate",
        delay: Math.abs(custom) * 0.1 
    }
  })
};

const MAX_HEALTH = 1000;

export const GlassPanel = ({ children, className, title, gameId, suppressOfflineOverlay }: GlassPanelProps) => {
  const registryRef = gameId ? usePanelRegistry(gameId) : null;
  
  const panelState = useGameStore((state) => 
    gameId ? state.panels[gameId] : null
  );
  
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const isGameOver = systemIntegrity <= 0;

  const health = panelState ? panelState.health : MAX_HEALTH;
  const healthPercent = (health / MAX_HEALTH) * 100; 
  
  const isDamaged = health < MAX_HEALTH;
  const isCritical = health < (MAX_HEALTH * 0.3);

  let borderColor = "border-elfy-green-dim/30";
  if (isCritical) borderColor = "border-elfy-red/80 animate-pulse";
  else if (isDamaged) borderColor = "border-elfy-yellow/50";

  // Random seed for shatter animation
  const randSeed = (title?.length || 5) % 2 === 0 ? 1 : -1;

  return (
    <motion.div 
      ref={registryRef}
      variants={panelVariants}
      initial="hidden"
      animate={isGameOver ? "shattered" : "visible"}
      custom={randSeed}
      className={clsx(
        "relative overflow-hidden flex flex-col",
        "bg-black border",
        borderColor, 
        "shadow-[0_0_15px_rgba(11,212,38,0.05)]", 
        "rounded-sm",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(10,10,10,0.4)_50%)] z-0 bg-[length:100%_4px]" />
      
      {title && (
        <div className="relative flex flex-col border-b border-elfy-green-dim/30 bg-elfy-green-dark/20 shrink-0">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-sm md:text-base font-header font-bold text-elfy-green uppercase tracking-wider drop-shadow-md">
              {title}
            </span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-elfy-green" />
              <div className="w-2 h-2 rounded-full border border-elfy-purple-dim" />
            </div>
          </div>

          {gameId && (
            <div className="w-full h-1 bg-black/50">
              <motion.div 
                className={clsx("h-full transition-colors duration-300", 
                  healthPercent > 60 ? "bg-elfy-green" : 
                  healthPercent > 30 ? "bg-elfy-yellow" : "bg-elfy-red"
                )}
                initial={{ width: "100%" }}
                animate={{ width: `${healthPercent}%` }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
              />
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 p-4 h-full">
        {/* Offline Overlay */}
        {health <= 0 && !isGameOver && !suppressOfflineOverlay && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center border-4 border-elfy-red m-1">
            <span className="text-elfy-red font-header font-black text-xl animate-pulse">SECURITY BREACH</span>
            <span className="text-xs text-elfy-red font-mono mt-1">SPAWNING HOSTILES...</span>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
};
