import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Zap, Swords, Maximize, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { memo, useCallback } from 'react';
import { UpgradeButton } from '@/ui/kit/atoms/UpgradeButton';

interface RailgunBadgeProps {
  isPanelDead: boolean;
  onHoverCost: (cost: number | null) => void;
}

const StatRow = ({ label, icon: Icon, level, max, path, canAfford, onUpgrade, onHoverCost, color = "bg-primary-green", text = "text-primary-green" }: any) => (
    <div className="flex h-10 w-full bg-black/40 border border-white/5 relative group overflow-hidden">
        {/* Left: Injector Button */}
        <UpgradeButton 
            path={path}
            disabled={level >= max}
            canAfford={canAfford}
            onUpgrade={onUpgrade}
            onHoverCost={onHoverCost}
            colorClass={color}
            heightClass="h-full"
        />
        
        {/* Right: Data Display */}
        <div className="flex-1 flex items-center justify-between px-3 relative">
            {/* Label */}
            <div className="flex items-center gap-2 z-10">
                <Icon size={12} className={clsx(text, "opacity-70")} />
                <span className={clsx("text-[9px] font-mono font-bold tracking-widest", text)}>
                    {label}
                </span>
            </div>

            {/* Diagonal Bar Graph */}
            <div className="flex gap-1 h-3 ml-4 flex-1 justify-end max-w-[120px]">
                {Array.from({ length: max }).map((_, i) => (
                    <div 
                        key={i} 
                        className={clsx(
                            "flex-1 h-full skew-x-[-20deg] transition-all duration-300", 
                            i < level 
                                ? clsx(color, "shadow-[0_0_8px_currentColor] opacity-100") 
                                : "bg-white/10 opacity-30"
                        )} 
                    />
                ))}
            </div>
        </div>
    </div>
);

export const RailgunBadge = memo(({ isPanelDead, onHoverCost }: RailgunBadgeProps) => {
  const { railgun, upgradePoints, selectUpgrade } = useGameStore(state => ({
    railgun: state.railgun,
    upgradePoints: state.upgradePoints,
    selectUpgrade: state.selectUpgrade
  }));

  const handleUpgrade = useCallback((path: any, e: React.MouseEvent) => {
    if (isPanelDead || upgradePoints <= 0) return;
    selectUpgrade(path);
    AudioSystem.playClick(getPan(e));
  }, [isPanelDead, upgradePoints, selectUpgrade]);

  const canAfford = upgradePoints > 0;

  return (
    <div className={clsx("flex flex-col gap-3 transition-all duration-500", isPanelDead ? "opacity-30 grayscale pointer-events-none" : "opacity-100")}>
        
        {/* Header */}
        <div className="flex items-center justify-between pl-1 border-l-2 border-primary-green">
            <h3 className="text-sm font-header font-black text-primary-green tracking-widest uppercase ml-2">
                RAILGUN
            </h3>
            <Crosshair size={14} className="text-primary-green opacity-50" />
        </div>

        {/* Stats Grid */}
        <div className="flex flex-col gap-2">
            <StatRow 
                label="BEAM_WIDTH" 
                icon={Maximize} 
                level={railgun.widthLevel} 
                max={10} 
                path="RAILGUN_WIDTH" 
                canAfford={canAfford} 
                onUpgrade={handleUpgrade} 
                onHoverCost={onHoverCost}
            />
            
            <div className="grid grid-cols-2 gap-2">
                <StatRow 
                    label="DAMAGE" 
                    icon={Swords} 
                    level={railgun.damageLevel} 
                    max={3} 
                    path="RAILGUN_DAMAGE" 
                    canAfford={canAfford} 
                    onUpgrade={handleUpgrade} 
                    onHoverCost={onHoverCost}
                />
                <StatRow 
                    label="RATE" 
                    icon={Zap} 
                    level={railgun.rateLevel} 
                    max={3} 
                    path="RAILGUN_RATE" 
                    canAfford={canAfford} 
                    onUpgrade={handleUpgrade} 
                    onHoverCost={onHoverCost}
                />
            </div>
        </div>
    </div>
  );
});
RailgunBadge.displayName = 'RailgunBadge';
