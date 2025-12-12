import { clsx } from 'clsx';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ReactNode, useEffect as useReactEffect, useState as useReactState, useRef as useReactRef } from 'react';
import { usePanelRegistry } from '@/game/hooks/usePanelRegistry';
import { useGameStore } from '@/game/store/useGameStore';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { Skull } from 'lucide-react';
import { PanelSparks } from './PanelSparks';
import { useHeartbeat } from '@/game/hooks/useHeartbeat';

import { RebootOverlay } from '@/ui/molecules/panel/RebootOverlay';
import { IntelligentHeader } from '@/ui/molecules/panel/IntelligentHeader';
import { BreachOverlay } from '@/ui/molecules/panel/BreachOverlay';
import { SafePanelContent } from './SafePanelContent';
import { DotGridBackground } from './DotGridBackground';

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

const pulseVariants = {
    heartbeat: {
        opacity: [0, 0.6, 0],
        scale: [1, 1.005, 1], 
        transition: { 
            duration: 0.8, 
            times: [0, 0.04, 1], 
            ease: "easeOut" 
        }
    }
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
  const isCriticalGlobal = systemIntegrity < 30 && !isGameOver;

  const panelState = useGameStore((state) => gameId ? state.panels[gameId] : null);
  
  const health = panelState ? panelState.health : MAX_HEALTH;
  const isDestroyed = panelState ? panelState.isDestroyed : false;
  
  let rawPercent = (health / MAX_HEALTH) * 100;
  if (!Number.isFinite(rawPercent) || isNaN(rawPercent)) rawPercent = 0;
  const healthPercent = Math.max(0, Math.min(100, rawPercent));
  
  const isDamaged = !isDestroyed && health < MAX_HEALTH;

  const [showReboot, setShowReboot] = useReactState(false);
  const prevDestroyed = useReactRef(isDestroyed);
  
  const shakeControls = useAnimation();
  const heartbeatControls = useHeartbeat(); 

  const randSeed = (title?.length || 5) % 2 === 0 ? 1 : -1;

  useReactEffect(() => {
      if (isGameOver) {
          shakeControls.start("shattered");
      } else {
          shakeControls.start("visible");
      }
  }, [isGameOver, shakeControls]);

  useReactEffect(() => {
    if (prevDestroyed.current && !isDestroyed && !isGameOver) {
        setShowReboot(true);
        const timer = setTimeout(() => setShowReboot(false), 2000); 
        return () => clearTimeout(timer);
    }
    prevDestroyed.current = isDestroyed;
  }, [isDestroyed, isGameOver]);

  useReactEffect(() => {
      if (!gameId) return;
      const unsub = GameEventBus.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
          if (p.id === gameId) {
              shakeControls.start({
                  x: [0, -5, 5, -5, 5, 0],
                  transition: { duration: 0.1 }
              });
          }
      });
      return unsub;
  }, [gameId, shakeControls]);

  let borderColor = "border-primary-green-dim/30";
  if (isDestroyed) {
      borderColor = isInteracting 
        ? "border-latent-purple shadow-[0_0_10px_#9E4EA5]" 
        : "border-critical-red animate-pulse"; 
  }
  else if (isInteracting && isDamaged) borderColor = "border-service-cyan shadow-[0_0_10px_#00F0FF]";
  else if (isDamaged) borderColor = "border-alert-yellow/50";

  const bgClass = isDestroyed ? "bg-black/20" : "bg-black";

  return (
    <motion.div 
      ref={registryRef}
      variants={panelVariants}
      initial="hidden"
      animate={shakeControls}
      custom={randSeed}
      className={clsx(
        "relative overflow-hidden flex flex-col group",
        bgClass, 
        "border",
        borderColor, 
        "rounded-sm",
        className
      )}
    >
      {/* 
         DOT GRID FIX:
         Added 'top-8' (2rem/32px) to offset the pattern below the IntelligentHeader.
         This prevents dots from bleeding into the menu bar.
      */}
      <DotGridBackground className="top-8" />

      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(10,10,10,0.4)_50%)] z-0 bg-[length:100%_4px]" />
      
      {isCriticalGlobal && (
          <motion.div 
            className="absolute inset-0 pointer-events-none z-50 border-2 border-critical-red/60 shadow-[inset_0_0_30px_#FF003C]"
            animate={heartbeatControls}
            variants={pulseVariants}
            initial={{ opacity: 0 }}
          />
      )}

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
            <SafePanelContent fallbackId={`sparks-${gameId}`}>
                <PanelSparks intensity={isGameOver ? 'extreme' : 'normal'} />
            </SafePanelContent>
        )}

        <div className={clsx("h-full flex flex-col relative z-20", isGameOver ? "invisible" : "visible")}>
            {children}
            
            {isDestroyed && !isGameOver && (
                <SafePanelContent fallbackId={`breach-${gameId}`}>
                    <BreachOverlay 
                        progress={healthPercent} 
                        isVideo={gameId === 'video'} 
                        showInteractive={true} 
                    />
                </SafePanelContent>
            )}
        </div>

        <AnimatePresence>
            {showReboot && <RebootOverlay key="reboot" />}
        </AnimatePresence>
        
        {isGameOver && (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-transparent pointer-events-none">
                <Skull className="text-critical-red animate-pulse w-20 h-20 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                <span className="text-critical-red font-header font-black text-2xl tracking-widest drop-shadow-lg">SYSTEM FAILURE</span>
            </div>
        )}
      </div>
    </motion.div>
  );
};
