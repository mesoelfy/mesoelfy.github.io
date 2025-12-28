import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Zap, Swords, Maximize } from 'lucide-react';
import { clsx } from 'clsx';
import { PALETTE } from '@/engine/config/Palette';
import { memo, useCallback } from 'react';
import { UpgradeButton } from '@/ui/kit/atoms/UpgradeButton';

interface RailgunBadgeProps {
  isPanelDead: boolean;
  onHoverCost: (cost: number | null) => void;
}

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
    <div className={clsx("p-5 border border-primary-green/30 bg-black/40 relative overflow-hidden transition-all flex flex-col gap-6", isPanelDead ? "opacity-50 grayscale pointer-events-none" : "")}>
        <div className="flex justify-between items-center border-b border-primary-green/20 pb-3">
            <div>
                <h3 className="text-xl font-header font-black text-primary-green tracking-widest">RAILGUN</h3>
                <span className="text-[9px] font-mono text-primary-green-dim block mt-0.5">CLASS: KINETIC_BEAM</span>
            </div>
            <div className="text-xs font-bold text-primary-green bg-primary-green/10 px-3 py-1 border border-primary-green/20">
                MK.{1 + Math.floor((railgun.widthLevel + railgun.damageLevel + railgun.rateLevel) / 3)}
            </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-1 text-[10px] text-primary-green font-mono tracking-widest font-bold">
                    <Maximize size={12} /> BEAM_WIDTH
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-mono text-primary-green-dim">{railgun.widthLevel}/10</span>
                    <UpgradeButton 
                        path="RAILGUN_WIDTH" 
                        disabled={railgun.widthLevel >= 10} 
                        canAfford={canAfford} 
                        onUpgrade={handleUpgrade} 
                        onHoverCost={onHoverCost} 
                    />
                </div>
            </div>
            <div className="flex h-6 gap-0.5 w-full bg-black/60 p-1 border border-primary-green/20">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={clsx("flex-1 h-full transition-all duration-300 relative overflow-hidden", i < railgun.widthLevel ? "bg-primary-green shadow-[0_0_5px_#78F654]" : "bg-primary-green/5")} >
                        {i < railgun.widthLevel && <div className="absolute inset-0 bg-white/20" />}
                    </div>
                ))}
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full">
            {[
                { label: "DAMAGE", level: railgun.damageLevel, max: 3, icon: Swords, path: "RAILGUN_DAMAGE" },
                { label: "RATE", level: railgun.rateLevel, max: 3, icon: Zap, path: "RAILGUN_RATE" }
            ].map(stat => (
                <div key={stat.path} className="flex flex-col gap-2 flex-1 p-3 bg-black/20 border border-primary-green/10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[10px] text-primary-green font-mono tracking-widest font-bold">
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
                    <div className="flex gap-1 h-4 mt-1">
                        {Array.from({ length: stat.max }).map((_, i) => (
                            <div key={i} className={clsx("flex-1 h-full skew-x-[-15deg] border transition-colors", i < stat.level ? "bg-primary-green border-primary-green shadow-[0_0_5px_#78F654]" : "bg-transparent border-primary-green/20")} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none" style={{ backgroundImage: `linear-gradient(135deg, transparent 50%, ${PALETTE.GREEN.PRIMARY} 50%)` }} />
    </div>
  );
});
RailgunBadge.displayName = 'RailgunBadge';
