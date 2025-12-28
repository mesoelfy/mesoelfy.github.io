import { clsx } from 'clsx';
import { ArrowUpCircle } from 'lucide-react';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { memo } from 'react';

interface Props {
  path: any; // Using any to avoid circular type deps with game.types easily, or strict if preferred
  disabled: boolean;
  canAfford: boolean;
  onUpgrade: (path: any, e: React.MouseEvent) => void;
  onHoverCost: (cost: number | null) => void;
  width?: string;
}

export const UpgradeButton = memo(({ path, disabled, canAfford, onUpgrade, onHoverCost, width = "w-24" }: Props) => {
  const isDisabled = disabled || !canAfford;

  return (
      <button 
          onClick={(e) => {
              if (!isDisabled) onUpgrade(path, e);
          }}
          onMouseEnter={() => {
              if (!isDisabled) {
                  onHoverCost(1);
                  AudioSystem.playHover();
              }
          }}
          onMouseLeave={() => onHoverCost(null)}
          disabled={isDisabled}
          className={clsx(
              "flex items-center justify-center gap-1.5 px-4 h-6 text-[9px] font-bold tracking-widest border transition-all shrink-0",
              width,
              isDisabled 
                  ? "border-gray-800 text-gray-700 bg-transparent cursor-default" 
                  : "border-primary-green bg-primary-green/10 text-primary-green hover:bg-primary-green hover:text-black cursor-pointer shadow-[0_0_10px_rgba(120,246,84,0.1)]"
          )}
      >
          {!isDisabled && <ArrowUpCircle size={10} className="mb-0.5" />}
          <span className="leading-none mt-0.5">{isDisabled ? "MAXED" : "UPGRADE"}</span>
      </button>
  );
});

UpgradeButton.displayName = 'UpgradeButton';
