import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Zap, Swords, GitFork, Radar } from 'lucide-react';
import { clsx } from 'clsx';
import { memo, useCallback } from 'react';
import { UpgradeButton } from '@/ui/kit/atoms/UpgradeButton';

interface SnifferBadgeProps {
  isPanelDead: boolean;
  onHoverCost: (cost: number | null) => void;
}

const StatRow = ({ label, icon: Icon, level, max, path, canAfford, onUpgrade, onHoverCost, color = "bg-latent-purple", text = "text-latent-purple" }: any) => (
    <div className="flex h-10 w-full bg-black/40 border border-white/5 relative group overflow-hidden">
        <UpgradeButton 
            path={path}
            disabled={level >= max}
            canAfford={canAfford}
            onUpgrade={onUpgrade}
            onHoverCost={onHoverCost}
            colorClass={color}
            heightClass="h-full"
        />
        <div className="flex-1 flex items-center justify-between px-3 relative">
            <div className="flex items-center gap-2 z-10">
                <Icon size={12} className={clsx(text, "opacity-70")} />
                <span className={clsx("text-[9px] font-mono font-bold tracking-widest", text)}>
                    {label}
                </span>
            </div>
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

export const SnifferBadge = memo(({ isPanelDead, onHoverCost }: SnifferBadgeProps) => {
  const { sniffer, upgradePoints, selectUpgrade } = useGameStore(state => ({
    sniffer: state.sniffer,
    upgradePoints: state.upgradePoints,
    selectUpgrade: state.selectUpgrade
  }));

  const handleUpgrade = useCallback((path: any, e: React.MouseEvent) => {
    if (isPanelDead || upgradePoints <= 0) return;
    selectUpgrade(path);
    AudioSystem.playClick(getPan(e));
  }, [isPanelDead, upgradePoints, selectUpgrade]);

  const canAfford = upgradePoints > 0;
  
  const slotMapping = [0, 2, 1, 3]; 

  return (
    <div className={clsx("flex flex-col gap-3 transition-all duration-500", isPanelDead ? "opacity-30 grayscale pointer-events-none" : "opacity-100")}>
        
        {/* Header */}
        <div className="flex items-center justify-between pl-1 border-l-2 border-latent-purple">
            <h3 className="text-sm font-header font-black text-latent-purple tracking-widest uppercase ml-2">
                SNIFFER
            </h3>
            <Radar size={14} className="text-latent-purple opacity-50" />
        </div>

        {/* Capacity Row */}
        <div className="flex gap-2">
            <div className="flex-1">
                <StatRow 
                    label="CAPACITY" 
                    icon={GitFork} 
                    level={sniffer.capacityLevel} 
                    max={4} 
                    path="SNIFFER_CAPACITY" 
                    canAfford={canAfford} 
                    onUpgrade={handleUpgrade} 
                    onHoverCost={onHoverCost}
                />
            </div>
            
            {/* Radar Visual */}
            <div className="w-10 h-10 border border-latent-purple/30 bg-black/40 relative rounded-sm flex items-center justify-center shrink-0">
                <div className="absolute inset-0 opacity-20 bg-latent-purple/10" />
                <div className="relative w-6 h-6">
                    {slotMapping.map((mappedIndex, visualIndex) => {
                        const isActive = mappedIndex < sniffer.capacityLevel;
                        let posClass = "";
                        if (visualIndex === 0) posClass = "top-0 left-0"; 
                        if (visualIndex === 1) posClass = "top-0 right-0"; 
                        if (visualIndex === 2) posClass = "bottom-0 right-0"; 
                        if (visualIndex === 3) posClass = "bottom-0 left-0"; 
                        
                        return (
                            <div key={mappedIndex} className={clsx("absolute w-2 h-2 rounded-full transition-all duration-300", posClass, isActive ? "bg-latent-purple shadow-[0_0_5px_currentColor]" : "bg-white/10")} />
                        );
                    })}
                    <div className="absolute inset-0 m-auto w-1 h-1 bg-white/20 rounded-full" />
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
            <StatRow 
                label="DAMAGE" 
                icon={Swords} 
                level={sniffer.damageLevel} 
                max={3} 
                path="SNIFFER_DAMAGE" 
                canAfford={canAfford} 
                onUpgrade={handleUpgrade} 
                onHoverCost={onHoverCost}
            />
            <StatRow 
                label="RATE" 
                icon={Zap} 
                level={sniffer.rateLevel} 
                max={3} 
                path="SNIFFER_RATE" 
                canAfford={canAfford} 
                onUpgrade={handleUpgrade} 
                onHoverCost={onHoverCost}
            />
        </div>
    </div>
  );
});
SnifferBadge.displayName = 'SnifferBadge';
