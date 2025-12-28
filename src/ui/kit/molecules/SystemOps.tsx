import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Bomb, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface OpButtonProps {
  isPanelDead: boolean;
  onHoverCost: (cost: number | null) => void;
}

const OpButton = ({ isPanelDead, type, onHoverCost }: { isPanelDead: boolean, type: 'RESTORE' | 'PURGE', onHoverCost: (n: number | null) => void }) => {
  const upgradePoints = useGameStore(s => s.upgradePoints);
  const selectUpgrade = useGameStore(s => s.selectUpgrade);

  const handleUpgrade = (e: React.MouseEvent) => {
      if (upgradePoints <= 0) return; 
      AudioSystem.playClick(getPan(e));
      selectUpgrade(type);
  };

  if (upgradePoints <= 0) return null;

  const isPurge = type === 'PURGE';
  const label = isPurge ? 'PURGE' : 'REPAIR';
  const Icon = isPurge ? Bomb : Wrench;
  
  const borderColor = isPurge ? 'border-critical-red' : 'border-alert-yellow';
  // FIX: Using full static class strings for shadows instead of dynamic interpolation
  const shadowClass = isPurge 
    ? "shadow-[0_0_20px_#FF003C] hover:shadow-[0_0_40px_#FF003C]" 
    : "shadow-[0_0_20px_#eae747] hover:shadow-[0_0_40px_#eae747]";
    
  const bgInner = isPurge ? 'bg-critical-red' : 'bg-alert-yellow';
  const textInner = isPurge ? 'text-critical-red' : 'text-alert-yellow';
  
  const groupHoverBg = isPurge ? 'group-hover/opbtn:bg-critical-red' : 'group-hover/opbtn:bg-alert-yellow';
  const groupHoverText = 'group-hover/opbtn:text-black';
  const stripeColor = isPurge ? '#FF003C' : '#eae747';

  return (
    <button
        onClick={handleUpgrade}
        onMouseEnter={(e) => {
            if (!isPanelDead) {
                AudioSystem.playHover(getPan(e));
                onHoverCost(1);
            }
        }}
        onMouseLeave={() => onHoverCost(null)}
        className={clsx(
            "group/opbtn relative w-24 h-24 p-1 border bg-black/90 backdrop-blur-md overflow-hidden transition-shadow duration-300 rounded-sm",
            borderColor,
            shadowClass
        )}
        title={`${label} (1 PT)`}
    >
        {/* Hazard Stripes Background */}
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: `repeating-linear-gradient(45deg, ${stripeColor} 0, ${stripeColor} 5px, transparent 5px, transparent 10px)` }} 
        />
        
        {/* Inner Box */}
        <div className={clsx(
            "relative w-full h-full border flex flex-col items-center justify-center gap-1 bg-black transition-colors duration-300",
            isPurge ? "border-critical-red/50" : "border-alert-yellow/50",
            textInner,
            groupHoverBg,
            groupHoverText
        )}>
            <motion.div 
                animate={isPurge 
                    ? { rotate: [0, -10, 10, 0] } 
                    : { rotate: [0, -15, 15, 0] }
                } 
                transition={{ repeat: Infinity, duration: isPurge ? 0.3 : 2.0, repeatDelay: isPurge ? 2 : 0.5, ease: "easeInOut" }} 
            >
                <Icon size={32} strokeWidth={2} />
            </motion.div>
            
            <div className="flex flex-col leading-none items-center">
                <span className="text-[10px] font-bold font-header tracking-wider">
                    {label}
                </span>
            </div>
        </div>
    </button>
  );
};

export const RepairButton = ({ isPanelDead, onHoverCost }: OpButtonProps) => <OpButton isPanelDead={isPanelDead} onHoverCost={onHoverCost} type="RESTORE" />;
export const PurgeButton = ({ isPanelDead, onHoverCost }: OpButtonProps) => <OpButton isPanelDead={isPanelDead} onHoverCost={onHoverCost} type="PURGE" />;
