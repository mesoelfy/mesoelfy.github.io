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
import { Cpu } from 'lucide-react';

const PointCounter = ({ value, isActive }: { value: number, isActive: boolean }) => {
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
        none: isActive ? PALETTE.GREEN.PRIMARY : '#555', // Dim grey when inactive
        up: '#7FF65F', 
        down: PALETTE.RED.CRITICAL
    };

    return (
        <motion.span 
            className="font-header font-black text-xl tabular-nums block relative z-10" 
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
  const hasPoints = upgradePoints > 0;
  const [hoverCost, setHoverCost] = useState<number | null>(null);

  const handleCostHover = useCallback((cost: number | null) => {
      setHoverCost(cost);
  }, []);

  return (
    <div className={clsx("flex flex-col h-full w-full relative overflow-hidden", isPanelDead ? 'grayscale opacity-50 pointer-events-none' : '')}>
      
      {/* HEADER: Points Display (Redesigned to match Badges) */}
      <div className="flex-none px-6 py-4 border-b border-primary-green/10 bg-black/20">
          <div className="flex flex-col gap-2 w-full">
                {/* Badge Header */}
                <div className={clsx("flex items-center justify-between pl-1 border-l-2 transition-colors duration-300", hasPoints ? "border-primary-green" : "border-white/20")}>
                    <h3 className={clsx("text-xs font-header font-black tracking-widest uppercase ml-2 transition-colors duration-300", hasPoints ? "text-primary-green" : "text-gray-600")}>
                        SYSTEM_RESOURCES
                    </h3>
                    <Cpu size={14} className={clsx("transition-colors duration-300", hasPoints ? "text-primary-green opacity-50" : "text-gray-700")} />
                </div>

                {/* Data Row */}
                <div className="flex h-10 w-full bg-black/40 border border-white/5 relative group overflow-hidden">
                    {/* Left Indicator */}
                    <div className={clsx("w-10 h-full flex items-center justify-center border-r border-white/10 transition-colors duration-300", hasPoints ? "bg-primary-green/10" : "bg-white/5")}>
                        <div className={clsx("w-1.5 h-1.5 transition-all duration-500", hasPoints ? "bg-primary-green shadow-[0_0_5px_#78F654]" : "bg-transparent border border-white/20 rounded-full")} />
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 flex items-center justify-between px-3 relative">
                        <span className={clsx("text-[9px] font-mono font-bold tracking-widest transition-colors duration-300", hasPoints ? "text-primary-green-dim group-hover:text-primary-green" : "text-gray-700")}>
                            AVAILABLE_PTS
                        </span>
                        
                        <div className="flex items-center gap-3 relative">
                            {/* Cost Indicator */}
                            <AnimatePresence>
                                {hoverCost !== null && hasPoints && (
                                    <motion.span 
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        className="text-lg font-header font-black text-critical-red drop-shadow-[0_0_5px_#FF003C] absolute right-full mr-3"
                                    >
                                        -{hoverCost}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            
                            <div className={clsx("transition-all duration-500", hasPoints ? "opacity-100" : "opacity-30")}>
                                <PointCounter value={upgradePoints} isActive={hasPoints} />
                            </div>
                        </div>
                    </div>
                    
                    {/* Decorative Diagonal Lines */}
                    <div className={clsx("absolute right-0 top-0 bottom-0 w-12 flex justify-end pointer-events-none transition-opacity duration-500", hasPoints ? "opacity-10" : "opacity-0")}>
                         <div className="w-full h-full" style={{ backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 2px, ${PALETTE.GREEN.PRIMARY} 2px, ${PALETTE.GREEN.PRIMARY} 3px)` }} />
                    </div>
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
