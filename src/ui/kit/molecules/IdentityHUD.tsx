import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStreamValue } from '@/ui/hooks/useStreamValue';
import { clsx } from 'clsx';
import { PanelId } from '@/engine/config/PanelConfig';
import { VitalsRing } from '@/ui/kit/atoms/VitalsRing';
import { UpgradeTerminal } from './UpgradeTerminal';
import { RepairButton, PurgeButton } from './SystemOps';
import { IdentityFooter } from './IdentityFooter';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle } from 'lucide-react';

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
      
      {/* HEADER: Points Display */}
      <div className="flex-none flex items-center justify-between px-6 h-10 border-b border-primary-green/10 bg-black/20">
          <div className="flex items-center gap-2">
              <ArrowUpCircle size={14} className={upgradePoints > 0 ? "text-primary-green animate-bounce" : "text-gray-600"} />
              {/* UPDATED: text-xl -> text-sm (approx 20-30% reduction depending on font metric) */}
              <span className="text-sm font-bold tracking-widest text-white">
                  AVAILABLE_POINTS
              </span>
          </div>
          
          <div className="flex items-center gap-3">
              <AnimatePresence>
                  {hoverCost !== null && (
                      <motion.span 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="text-xl font-header font-black text-critical-red drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]"
                      >
                          -{hoverCost}
                      </motion.span>
                  )}
              </AnimatePresence>
              <span className="font-header font-black text-xl text-primary-green">
                  {upgradePoints.toString().padStart(2, '0')}
              </span>
          </div>
      </div>

      {/* TOP SECTION: Vitals & Ops */}
      <div className="flex-none flex items-center justify-center gap-8 p-6 pb-2 border-b border-primary-green/10">
          
          {/* Left: Repair */}
          <div className="flex items-center">
              <RepairButton isPanelDead={isPanelDead} onHoverCost={handleCostHover} />
          </div>

          {/* Center: Crystal */}
          <div className="flex items-center justify-center">
              <VitalsRing health={hp} maxHealth={maxHp} xp={xp} xpToNext={nextXp} level={level} isDead={isPlayerDead} rebootProgress={rebootProgress} />
          </div>

          {/* Right: Purge */}
          <div className="flex items-center">
              <PurgeButton isPanelDead={isPanelDead} onHoverCost={handleCostHover} />
          </div>
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
