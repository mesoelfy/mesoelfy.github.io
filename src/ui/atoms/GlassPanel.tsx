import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect as useReactEffect, useState as useReactState, useRef as useReactRef } from 'react';
import { usePanelRegistry } from '@/game/hooks/usePanelRegistry';
import { useGameStore } from '@/game/store/useGameStore';
import { Skull } from 'lucide-react';
import { PanelSparks } from './PanelSparks';

// SUB-COMPONENTS
import { RebootOverlay } from '@/ui/molecules/panel/RebootOverlay';
import { IntelligentHeader } from '@/ui/molecules/panel/IntelligentHeader';
import { BreachOverlay } from '@/ui/molecules/panel/BreachOverlay';

const MAX_HEALTH = 1000;

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  shattered: (custom: number) => ({
    y: 350 + (custom * 50),
    opacity: 0.8,
    rotate: custom * 15,
    transition: { 
        duration: 1.5, 
        ease: "anticipate",
        delay: Math.abs(custom) * 0.1 
    }
  })
};

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  gameId?: string;
}

export const GlassPanel = ({ children, className, title, gameId }: GlassPanelProps) => {
  const registryRef = gameId ? usePanelRegistry(gameId) : null;
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  
  const interactionTarget = useGameStore(state => state.interactionTarget);
  const isInteracting = gameId && interactionTarget === gameId;

  const isGameOver = Math.floor(systemIntegrity) <= 0;
  const panelState = useGameStore((state) => gameId ? state.panels[gameId] : null);

  const health = panelState ? panelState.health : MAX_HEALTH;
  const isDestroyed = panelState ? panelState.isDestroyed : false;
  const healthPercent = (health / MAX_HEALTH) * 100; 
  const isDamaged = health < MAX_HEALTH;

  const [showReboot, setShowReboot] = useReactState(false);
  const prevDestroyed = useReactRef(isDestroyed);

  useReactEffect(() => {
    if (prevDestroyed.current && !isDestroyed && !isGameOver) {
        setShowReboot(true);
        const timer = setTimeout(() => setShowReboot(false), 2000); 
        return () => clearTimeout(timer);
    }
    prevDestroyed.current = isDestroyed;
  }, [isDestroyed, isGameOver]);

  let borderColor = "border-elfy-green-dim/30";
  if (isDestroyed) {
      borderColor = isInteracting 
        ? "border-elfy-purple shadow-[0_0_10px_#9E4EA5]" 
        : "border-elfy-red animate-pulse"; 
  }
  else if (isInteracting && isDamaged) borderColor = "border-elfy-cyan shadow-[0_0_10px_#00F0FF]";
  else if (isDamaged) borderColor = "border-elfy-yellow/50";

  const randSeed = (title?.length || 5) % 2 === 0 ? 1 : -1;

  // FIX: Dynamic Background Opacity
  // If destroyed, make background transparent so we can see 3D enemies spawning "inside"
  const bgClass = isDestroyed ? "bg-black/20" : "bg-black";

  return (
    <motion.div 
      ref={registryRef}
      variants={panelVariants}
      initial="hidden"
      animate={isGameOver ? "shattered" : "visible"}
      custom={randSeed}
      className={clsx(
        "relative overflow-hidden flex flex-col group",
        bgClass, // <--- Dynamic Background
        "border",
        borderColor, 
        "shadow-[0_0_15px_rgba(11,212,38,0.05)]", 
        "rounded-sm",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(10,10,10,0.4)_50%)] z-0 bg-[length:100%_4px]" />
      
      {title && (
          <IntelligentHeader 
            title={title} 
            health={health} 
            isDestroyed={isDestroyed} 
            isGameOver={isGameOver}
            gameId={gameId}
          />
      )}

      <div className="relative z-10 p-4 h-full">
        {(isDestroyed || isGameOver) && (
            <PanelSparks intensity={isGameOver ? 'extreme' : 'normal'} />
        )}

        <div className={clsx("h-full flex flex-col relative z-20", isGameOver ? "invisible" : "visible")}>
            {children}
            {isDestroyed && (
                <BreachOverlay 
                    progress={healthPercent} 
                    isVideo={gameId === 'video'} 
                    showInteractive={true} 
                />
            )}
        </div>

        <AnimatePresence>
            {showReboot && <RebootOverlay key="reboot" />}
        </AnimatePresence>
        
        {isGameOver && (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-transparent pointer-events-none">
                <Skull className="text-elfy-red animate-pulse w-20 h-20 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                <span className="text-elfy-red font-header font-black text-2xl tracking-widest drop-shadow-lg">SYSTEM FAILURE</span>
            </div>
        )}
      </div>
    </motion.div>
  );
};
