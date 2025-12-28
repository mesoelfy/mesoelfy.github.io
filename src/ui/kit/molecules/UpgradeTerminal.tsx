import { useGameStore } from '@/engine/state/game/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RailgunBadge } from './badges/RailgunBadge';
import { SnifferBadge } from './badges/SnifferBadge';

interface UpgradeTerminalProps {
  isPanelDead: boolean;
  onHoverCost: (cost: number | null) => void;
}

export const UpgradeTerminal = ({ isPanelDead, onHoverCost }: UpgradeTerminalProps) => {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <AnimatePresence mode="wait">
        <motion.div 
            key="badges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
        >
            <RailgunBadge isPanelDead={isPanelDead} onHoverCost={onHoverCost} />
            <SnifferBadge isPanelDead={isPanelDead} onHoverCost={onHoverCost} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
