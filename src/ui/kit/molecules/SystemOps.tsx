import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Bomb, Wrench } from 'lucide-react';
import { UpgradePath } from '@/engine/types/game.types';
import { clsx } from 'clsx';

interface OpButtonProps {
  isPanelDead: boolean;
}

const OpButton = ({ isPanelDead, type }: { isPanelDead: boolean, type: 'RESTORE' | 'PURGE' }) => {
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
  
  const baseColor = isPurge ? 'border-critical-red/50 bg-critical-red/10' : 'border-alert-yellow/30 bg-alert-yellow/5';
  const hoverColor = isPurge ? 'hover:border-critical-red' : 'hover:border-alert-yellow';
  const textColor = isPurge ? 'text-critical-red' : 'text-alert-yellow';
  const fillClass = isPurge ? 'bg-critical-red' : 'bg-alert-yellow';

  return (
    <button
        onClick={handleUpgrade}
        onMouseEnter={(e) => !isPanelDead && AudioSystem.playHover(getPan(e))}
        className={clsx(
            "group relative flex flex-col items-center justify-center p-2 border transition-all duration-200 overflow-hidden text-center w-24 h-24 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.3)]",
            baseColor, hoverColor
        )}
        title={`${label} (1 PT)`}
    >
        <div className={clsx("absolute inset-0 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out opacity-20", fillClass)} />
        
        <div className="relative z-10 flex flex-col items-center gap-2">
            <Icon size={32} className={clsx("transition-transform group-hover:scale-110 duration-200", textColor, "group-hover:text-white")} />
            <div className="flex flex-col leading-none">
                <span className={clsx("text-[10px] font-bold font-header tracking-wider group-hover:text-white transition-colors", textColor)}>
                    {label}
                </span>
                <span className="text-[8px] text-gray-500 font-mono group-hover:text-white/70">
                    1 PT
                </span>
            </div>
        </div>
    </button>
  );
};

export const RepairButton = ({ isPanelDead }: OpButtonProps) => <OpButton isPanelDead={isPanelDead} type="RESTORE" />;
export const PurgeButton = ({ isPanelDead }: OpButtonProps) => <OpButton isPanelDead={isPanelDead} type="PURGE" />;
