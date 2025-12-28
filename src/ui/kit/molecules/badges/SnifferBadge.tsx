import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Zap, Swords, GitFork } from 'lucide-react';
import { clsx } from 'clsx';
import { memo, useCallback } from 'react';
import { UpgradeButton } from '@/ui/kit/atoms/UpgradeButton';

interface SnifferBadgeProps {
  isPanelDead: boolean;
  onHoverCost: (cost: number | null) => void;
}

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

  return (
    <div className={clsx("p-5 border border-latent-purple/30 bg-black/40 relative overflow-hidden transition-all", isPanelDead ? "opacity-50 grayscale pointer-events-none" : "")}>
        <div className="flex justify-between items-center mb-6 border-b border-latent-purple/20 pb-3">
            <div>
                <h3 className="text-xl font-header font-black text-latent-purple tracking-widest">SNIFFER</h3>
                <span className="text-[9px] font-mono text-latent-purple-light block mt-0.5">CLASS: HOMING_SWARM</span>
            </div>
            <div className="text-xs font-bold text-latent-purple bg-latent-purple/10 px-3 py-1 border border-latent-purple/20">
                MK.{1 + Math.floor((sniffer.capacityLevel + sniffer.damageLevel + sniffer.rateLevel) / 3)}
            </div>
        </div>

        <div className="flex flex-row items-stretch gap-6">
            <div className="shrink-0 flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 flex items-center justify-center border border-latent-purple/20 rounded-full bg-black/40 shadow-[inset_0_0_20px_rgba(158,78,165,0.1)]">
                    <div className="absolute inset-3 border border-latent-purple/10 rounded-full" />
                    {[0, 1, 3, 2].map((mappedIndex, visualIndex) => {
                        const isActive = mappedIndex < sniffer.capacityLevel;
                        let posClass = "";
                        if (visualIndex === 0) posClass = "top-0 left-0 -translate-x-1/4 -translate-y-1/4";
                        if (visualIndex === 1) posClass = "top-0 right-0 translate-x-1/4 -translate-y-1/4";
                        if (visualIndex === 2) posClass = "bottom-0 right-0 translate-x-1/4 translate-y-1/4";
                        if (visualIndex === 3) posClass = "bottom-0 left-0 -translate-x-1/4 translate-y-1/4";
                        return (
                            <div key={mappedIndex} className={clsx("absolute w-6 h-6 border-2 transition-all duration-300 rounded-full flex items-center justify-center", posClass, isActive ? "bg-latent-purple border-latent-purple shadow-[0_0_10px_#9E4EA5]" : "bg-black border-latent-purple/30")}>
                                {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                        );
                    })}
                    <GitFork className="text-latent-purple opacity-50" size={24} />
                </div>
                <UpgradeButton 
                    path="SNIFFER_CAPACITY" 
                    disabled={sniffer.capacityLevel >= 4} 
                    canAfford={canAfford} 
                    onUpgrade={handleUpgrade} 
                    onHoverCost={onHoverCost} 
                    width="w-24"
                />
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
                {[
                    { label: "DMG", level: sniffer.damageLevel, max: 3, icon: Swords, path: "SNIFFER_DAMAGE" },
                    { label: "SPD", level: sniffer.rateLevel, max: 3, icon: Zap, path: "SNIFFER_RATE" }
                ].map(stat => (
                    <div key={stat.path} className="flex flex-col gap-2 p-3 bg-black/20 border border-latent-purple/10 w-full">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 text-[10px] text-latent-purple font-mono tracking-widest font-bold">
                                <stat.icon size={12} /> {stat.label}
                            </div>
                            <UpgradeButton 
                                path={stat.path} 
                                disabled={stat.level >= stat.max} 
                                canAfford={canAfford} 
                                onUpgrade={handleUpgrade} 
                                onHoverCost={onHoverCost} 
                            />
                        </div>
                        <div className="flex gap-1 h-3 mt-1">
                            {Array.from({ length: stat.max }).map((_, i) => (
                                <div key={i} className={clsx("flex-1 h-full rounded-[1px] transition-colors", i < stat.level ? "bg-latent-purple shadow-[0_0_5px_#9E4EA5]" : "bg-latent-purple/10")} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
});
SnifferBadge.displayName = 'SnifferBadge';
