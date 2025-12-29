import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStreamValue } from '@/ui/hooks/useStreamValue';
import { clsx } from 'clsx';
import { PanelId } from '@/engine/config/PanelConfig';
import { VitalsRing } from '@/ui/kit/atoms/VitalsRing';
import { UpgradeTerminal } from './UpgradeTerminal';
import { RepairButton, PurgeButton } from './SystemOps';
import { IdentityFooter } from './IdentityFooter';
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { PALETTE } from '@/engine/config/Palette';

const PointCounter = ({ value }: { value: number }) => {
    const count = useMotionValue(value);
    const rounded = useTransform(count, latest => Math.round(latest).toString().padStart(2, '0'));
    const [flash, setFlash] = useState<'none'|'up'|'down'>('none');
    const prev = useRef(value);

    useEffect(() => {
        if (value !== prev.current) {
            const dir = value > prev.current ? 'up' : 'down';
            setFlash(dir);
            const controls = animate(count, value, { duration: 0.3, ease: "circOut" });
            const t = setTimeout(() => setFlash('none'), 300);
            prev.current = value;
            return () => { controls.stop(); clearTimeout(t); };
        }
    }, [value, count]);

    const colors = {
        none: PALETTE.GREEN.PRIMARY,
        up: '#7FF65F', 
        down: PALETTE.RED.CRITICAL
    };

    return (
        <motion.span 
            className="font-header font-black text-2xl tabular-nums block relative z-10" 
            animate={{ 
                color: colors[flash],
                scale: flash !== 'none' ? 1.1 : 1,
                textShadow: flash === 'up' ? `0 0 10px rgba(127, 246, 95, 0.4)` : (flash === 'down' ? "0 0 15px #FF003C" : "0 0 0px transparent")
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
            {rounded}
        </motion.span>
    );
};

const AnimatedLabel = ({ value }: { value: number }) => {
    return (
        <motion.div
            key={value}
            initial={{ opacity: 0.5, filter: 'brightness(1)' }}
            animate={{ opacity: 0.7, filter: 'brightness(1.5)' }}
            exit={{ opacity: 0.5 }}
            transition={{ duration: 0.1, yoyo: Infinity }}
            className="text-[10px] font-mono font-bold tracking-widest text-primary-green-dim"
        >
            AVAILABLE_POINTS
        </motion.div>
    );
};

export const IdentityHUD = () => {
  const hp = useStreamValue('PLAYER_HEALTH');
  const maxHp = useStreamValue('PLAYER_MAX_HEALTH');
  const xp = useStreamValue('XP');
  const nextXp = useStreamValue('XP_NEXT');
  const level = useStreamValue('LEVEL');
  const rebootProgress = useStreamValue('PLAYER_REBOOT');

  const panel = useGameStore(s => s.panels[PanelId.IDENTITY]);
  const isPanelDead = panel ? panel.isDestroyed : false;
  const isPlayerDead = hp <= 0;
  
  const upgradePoints = useGameStore(s => s.upgradePoints);
  const [hoverCost, setHoverCost] = useState<number | null>(null);

  const handleCostHover = useCallback((cost: number | null) => {
      setHoverCost(cost);
  }, []);

  return (
    <div className={clsx("flex flex-col h-full w-full relative overflow-hidden", isPanelDead ? 'grayscale opacity-50 pointer-events-none' : '')}>
      
      {/* HEADER: Points Display (CENTERED) */}
      <div className="flex-none flex items-center justify-center px-6 h-14 border-b border-primary-green/10 bg-black/20 relative">
          
          <div className="flex items-center gap-4 bg-primary-green/5 px-4 py-1.5 rounded-sm border border-primary-green/10 relative overflow-hidden transition-all duration-300 hover:border-primary-green/30">
              {/* Scanline */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(120,246,84,0.05)_50%,transparent_100%)] w-full h-full pointer-events-none" />
              
              <AnimatedLabel value={upgradePoints} />
              
              <div className="w-px h-4 bg-primary-green/20" />

              {/* Fixed Width Container: w-14 (56px) is enough for "00 -1" without gap */}
              <div className="flex items-center justify-start w-14">
                  <PointCounter value={upgradePoints} />
                  
                  <AnimatePresence>
                      {hoverCost !== null && (
                          <motion.span 
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 4 }}
                              exit={{ opacity: 0, x: -2 }}
                              className="text-lg font-header font-black text-critical-red drop-shadow-[0_0_5px_#FF003C]"
                          >
                              -{hoverCost}
                          </motion.span>
                      )}
                  </AnimatePresence>
              </div>
          </div>
      </div>

      {/* TOP SECTION: Vitals & Ops */}
      <div className="flex-none flex items-center justify-center gap-8 p-6 pb-2 border-b border-primary-green/10">
          <div className="flex items-center"><RepairButton isPanelDead={isPanelDead} onHoverCost={handleCostHover} /></div>
          <div className="flex items-center justify-center">
              <VitalsRing health={hp} maxHealth={maxHp} xp={xp} xpToNext={nextXp} level={level} isDead={isPlayerDead} rebootProgress={rebootProgress} />
          </div>
          <div className="flex items-center"><PurgeButton isPanelDead={isPanelDead} onHoverCost={handleCostHover} /></div>
      </div>

      {/* BOTTOM SECTION: Upgrade Badges */}
      <div className="flex-1 min-h-0 w-full px-4 overflow-y-auto scrollbar-hide relative py-4">
         <div className={isPlayerDead ? "opacity-50 pointer-events-none" : ""}>
             <UpgradeTerminal isPanelDead={isPanelDead} onHoverCost={handleCostHover} />
         </div>
      </div>
      
      <IdentityFooter isPanelDead={isPanelDead} />
    </div>
  );
};
