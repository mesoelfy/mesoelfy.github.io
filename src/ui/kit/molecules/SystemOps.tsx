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

const OPS_COST = 2;

const OpButton = ({ isPanelDead, type, onHoverCost }: { isPanelDead: boolean, type: 'RESTORE' | 'PURGE', onHoverCost: (n: number | null) => void }) => {
  const upgradePoints = useGameStore(s => s.upgradePoints);
  const selectUpgrade = useGameStore(s => s.selectUpgrade);

  const canAfford = upgradePoints >= OPS_COST;

  const handleUpgrade = (e: React.MouseEvent) => {
      if (!canAfford) {
          AudioSystem.playSound('ui_error');
          return;
      } 
      AudioSystem.playClick(getPan(e));
      selectUpgrade(type);
  };

  const isPurge = type === 'PURGE';
  const label = isPurge ? 'PURGE' : 'REPAIR';
  const Icon = isPurge ? Bomb : Wrench;
  
  // Dynamic Styling based on Affordability
  const borderColor = canAfford 
    ? (isPurge ? 'border-critical-red' : 'border-alert-yellow') 
    : 'border-white/10';
  
  const shadowClass = canAfford 
    ? (isPurge ? "shadow-[0_0_20px_#FF003C] hover:shadow-[0_0_40px_#FF003C]" : "shadow-[0_0_20px_#eae747] hover:shadow-[0_0_40px_#eae747]")
    : "shadow-none";
    
  const textInner = canAfford 
    ? (isPurge ? 'text-critical-red' : 'text-alert-yellow')
    : 'text-gray-600';
  
  const groupHoverBg = canAfford 
    ? (isPurge ? 'group-hover/opbtn:bg-critical-red' : 'group-hover/opbtn:bg-alert-yellow') 
    : '';
    
  const groupHoverText = canAfford ? 'group-hover/opbtn:text-black' : '';
  
  // Only show stripes if active
  const stripeColor = canAfford ? (isPurge ? '#FF003C' : '#eae747') : 'transparent';

  return (
    <button
        onClick={handleUpgrade}
        onMouseEnter={(e) => {
            if (!isPanelDead) {
                if (canAfford) {
                    AudioSystem.playHover(getPan(e));
                    onHoverCost(OPS_COST);
                }
            }
        }}
        onMouseLeave={() => onHoverCost(null)}
        disabled={false} // Always clickable to play error sound
        className={clsx(
            "group/opbtn relative w-24 h-24 p-1 border bg-black/90 backdrop-blur-md overflow-hidden transition-all duration-300 rounded-sm",
            borderColor,
            shadowClass,
            !canAfford && "cursor-not-allowed opacity-50 grayscale"
        )}
        title={`${label} (${OPS_COST} PTS)`}
    >
        {/* Hazard Stripes Background */}
        {canAfford && (
            <div 
                className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ backgroundImage: `repeating-linear-gradient(45deg, ${stripeColor} 0, ${stripeColor} 5px, transparent 5px, transparent 10px)` }} 
            />
        )}
        
        {/* Inner Box */}
        <div className={clsx(
            "relative w-full h-full border flex flex-col items-center justify-center gap-1 bg-black transition-colors duration-300",
            canAfford ? (isPurge ? "border-critical-red/50" : "border-alert-yellow/50") : "border-white/5",
            textInner,
            groupHoverBg,
            groupHoverText
        )}>
            <motion.div 
                animate={canAfford && !isPanelDead
                    ? (isPurge ? { rotate: [0, -10, 10, 0] } : { rotate: [0, -15, 15, 0] })
                    : {}
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
