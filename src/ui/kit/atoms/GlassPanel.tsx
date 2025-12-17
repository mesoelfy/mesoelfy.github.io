import { clsx } from 'clsx';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ReactNode, useEffect as useReactEffect, useState as useReactState, useRef as useReactRef } from 'react';
import { usePanelRegistry } from '@/ui/sim/hooks/usePanelRegistry';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { Skull } from 'lucide-react';
import { PanelSparks } from './PanelSparks';
import { useHeartbeat } from '@/ui/sim/hooks/useHeartbeat';
import { RebootOverlay } from '@/ui/kit/molecules/panel/RebootOverlay';
import { IntelligentHeader } from '@/ui/kit/molecules/panel/IntelligentHeader';
import { BreachOverlay } from '@/ui/kit/molecules/panel/BreachOverlay';
import { SafePanelContent } from './SafePanelContent';
import { DotGridBackground } from './DotGridBackground';

const DEFAULT_MAX_HEALTH = 100;

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  shattered: (custom: number) => ({
    y: 350 + (custom * 50),
    opacity: 0.8,
    rotate: custom * 15,
    transition: { duration: 1.5, ease: "anticipate", delay: Math.abs(custom) * 0.1 }
  })
};

const pulseVariants = {
    heartbeat: {
        opacity: [0, 0.6, 0],
        scale: [1, 1.005, 1], 
        transition: { duration: 0.8, times: [0, 0.04, 1], ease: "easeOut" }
    }
};

const CircuitLockOverlay = () => (
    <motion.div 
        className="absolute inset-0 pointer-events-none z-[60] border-2 border-white/50 bg-primary-green/20 shadow-[inset_0_0_20px_#78F654]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
    />
);

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  gameId?: string;
  maxHealth?: number; 
}

export const GlassPanel = ({ children, className, title, gameId, maxHealth = DEFAULT_MAX_HEALTH }: GlassPanelProps) => {
  const registryRef = gameId ? usePanelRegistry(gameId) : null;
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const interactionTarget = useGameStore(state => state.interactionTarget);
  
  const isInteracting = !!(gameId && interactionTarget === gameId);
  const isGameOver = Math.floor(systemIntegrity) <= 0;
  const isCriticalGlobal = systemIntegrity < 30 && !isGameOver;
  const panelState = useGameStore((state) => gameId ? state.panels[gameId] : null);
  
  const health = panelState ? panelState.health : maxHealth;
  const isDestroyed = panelState ? panelState.isDestroyed : false;
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const isDamaged = !isDestroyed && health < maxHealth;

  const [showReboot, setShowReboot] = useReactState(false);
  const [showCircuitLock, setShowCircuitLock] = useReactState(false);
  
  const prevDestroyed = useReactRef(isDestroyed);
  const prevHealth = useReactRef(health);
  
  const shakeControls = useAnimation();
  const heartbeatControls = useHeartbeat(); 

  const randSeed = (title?.length || 5) % 2 === 0 ? 1 : -1;

  useReactEffect(() => {
      isGameOver ? shakeControls.start("shattered") : shakeControls.start("visible");
  }, [isGameOver, shakeControls]);

  useReactEffect(() => {
    if (prevDestroyed.current && !isDestroyed && !isGameOver) {
        setShowReboot(true);
        const timer = setTimeout(() => setShowReboot(false), 900); 
        return () => clearTimeout(timer);
    }
    prevDestroyed.current = isDestroyed;
  }, [isDestroyed, isGameOver]);

  useReactEffect(() => {
      if (prevHealth.current < maxHealth && health >= maxHealth && !isDestroyed && !isGameOver) {
          setShowCircuitLock(true);
          const timer = setTimeout(() => setShowCircuitLock(false), 1200); 
          prevHealth.current = health;
          return () => clearTimeout(timer);
      }
      if (health < maxHealth || isDestroyed || isGameOver) setShowCircuitLock(false);
      prevHealth.current = health;
  }, [health, maxHealth, isDestroyed, isGameOver]);

  useReactEffect(() => {
      if (!gameId) return;
      return GameEventBus.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
          if (p.id === gameId) {
              shakeControls.start({ x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.1 } });
          }
      });
  }, [gameId, shakeControls]);

  let borderColor = "border-primary-green-dim/30";
  if (showCircuitLock) borderColor = "border-primary-green"; 
  else if (isDestroyed) borderColor = isInteracting ? "border-latent-purple shadow-[0_0_10px_#9E4EA5]" : "border-critical-red animate-pulse"; 
  else if (isInteracting && isDamaged) borderColor = "border-service-cyan shadow-[0_0_10px_#00F0FF]";
  else if (isDamaged) borderColor = "border-alert-yellow/50";

  return (
    <motion.div 
      ref={registryRef}
      variants={panelVariants}
      initial="hidden"
      animate={shakeControls}
      custom={randSeed}
      className={clsx(
        "relative overflow-hidden flex flex-col group",
        isDestroyed ? "bg-black/20" : "bg-black", 
        "border", borderColor, "rounded-sm",
        showCircuitLock ? "animate-restore-flash" : "transition-colors duration-300",
        className
      )}
    >
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
            title={title} health={health} maxHealth={maxHealth} 
            isDestroyed={isDestroyed} isGameOver={isGameOver} gameId={gameId}
          />
      )}

      <div className="relative z-10 p-4 flex-1 min-h-0 flex flex-col">
        {(isDestroyed || isGameOver) && (
            <SafePanelContent fallbackId={`sparks-${gameId}`}>
                <PanelSparks intensity={isGameOver ? 'extreme' : 'normal'} />
            </SafePanelContent>
        )}
        <div className={clsx("flex-1 min-h-0 flex flex-col relative z-20", isGameOver ? "invisible" : "visible")}>
            {children}
            {isDestroyed && !isGameOver && (
                <SafePanelContent fallbackId={`breach-${gameId}`}>
                    <BreachOverlay 
                        progress={healthPercent} isVideo={gameId === 'video'} 
                        showInteractive={true} isRepairing={isInteracting} panelId={gameId} 
                    />
                </SafePanelContent>
            )}
        </div>
        <AnimatePresence>
            {showReboot && <RebootOverlay key="reboot" />}
            {showCircuitLock && <CircuitLockOverlay key="lock" />}
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
