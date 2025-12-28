import { useGameStore } from '@/engine/state/game/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle } from 'lucide-react';
import { RailgunBadge } from './badges/RailgunBadge';
import { SnifferBadge } from './badges/SnifferBadge';

interface UpgradeTerminalProps {
  isPanelDead: boolean;
}

export const UpgradeTerminal = ({ isPanelDead }: UpgradeTerminalProps) => {
  const upgradePoints = useGameStore(s => s.upgradePoints);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Points Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
              <ArrowUpCircle size={14} className={upgradePoints > 0 ? "text-primary-green animate-bounce" : "text-gray-600"} />
              <span className="text-[10px] font-bold tracking-widest text-white">
                  AVAILABLE_POINTS
              </span>
          </div>
          <span className="font-header font-black text-xl text-primary-green">
              {upgradePoints.toString().padStart(2, '0')}
          </span>
      </div>

      <AnimatePresence mode="wait">
        {/* We always show the badges now, they just grey out if 0 points */}
        <motion.div 
            key="badges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
        >
            <RailgunBadge isPanelDead={isPanelDead} />
            <SnifferBadge isPanelDead={isPanelDead} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
