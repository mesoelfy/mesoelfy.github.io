import { useGameStore } from '@/engine/state/game/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle } from 'lucide-react';
import { RailgunBadge } from './badges/RailgunBadge';
import { SnifferBadge } from './badges/SnifferBadge';
import { useState, useCallback } from 'react';

interface UpgradeTerminalProps {
  isPanelDead: boolean;
}

export const UpgradeTerminal = ({ isPanelDead }: UpgradeTerminalProps) => {
  const upgradePoints = useGameStore(s => s.upgradePoints);
  const [hoverCost, setHoverCost] = useState<number | null>(null);

  const handleCostHover = useCallback((cost: number | null) => {
      setHoverCost(cost);
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 h-10">
          <div className="flex items-center gap-2">
              <ArrowUpCircle size={14} className={upgradePoints > 0 ? "text-primary-green animate-bounce" : "text-gray-600"} />
              <span className="text-[10px] font-bold tracking-widest text-white">
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

      <AnimatePresence mode="wait">
        <motion.div 
            key="badges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
        >
            <RailgunBadge isPanelDead={isPanelDead} onHoverCost={handleCostHover} />
            <SnifferBadge isPanelDead={isPanelDead} onHoverCost={handleCostHover} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
