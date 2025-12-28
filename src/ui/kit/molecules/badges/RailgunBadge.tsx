import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Zap, Swords, Maximize } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { PALETTE } from '@/engine/config/Palette';

interface RailgunBadgeProps {
  isPanelDead: boolean;
}

export const RailgunBadge = ({ isPanelDead }: RailgunBadgeProps) => {
  const { railgun, upgradePoints, selectUpgrade } = useGameStore(state => ({
    railgun: state.railgun,
    upgradePoints: state.upgradePoints,
    selectUpgrade: state.selectUpgrade
  }));

  const handleUpgrade = (path: any, e: React.MouseEvent) => {
    if (isPanelDead || upgradePoints <= 0) return;
    selectUpgrade(path);
    AudioSystem.playClick(getPan(e));
  };

  const canAfford = upgradePoints > 0;

  // --- SUB-COMPONENTS ---

  const WidthBank = () => (
    <div className="flex flex-col gap-1 w-full" title="Beam Width">
        <div className="flex justify-between items-center text-[8px] text-primary-green-dim font-mono tracking-widest mb-1">
            <span className="flex items-center gap-1"><Maximize size={10} /> WIDTH_CAPACITOR</span>
            <span>{railgun.widthLevel}/10</span>
        </div>
        <div className="flex h-8 gap-0.5 w-full bg-black/60 p-1 border border-primary-green/20">
            {Array.from({ length: 10 }).map((_, i) => {
                const isActive = i < railgun.widthLevel;
                const isNext = i === railgun.widthLevel;
                const isInteractable = isNext && canAfford;
                
                return (
                    <button
                        key={i}
                        disabled={!isInteractable}
                        onClick={(e) => isInteractable && handleUpgrade('RAILGUN_WIDTH', e)}
                        className={clsx(
                            "flex-1 h-full transition-all duration-300 relative group overflow-hidden",
                            isActive ? "bg-primary-green" : "bg-primary-green/10",
                            isInteractable ? "hover:bg-primary-green/50 cursor-pointer animate-pulse" : "cursor-default"
                        )}
                    >
                        {isActive && <div className="absolute inset-0 bg-white/20" />}
                    </button>
                );
            })}
        </div>
    </div>
  );

  const StatModule = ({ label, level, max, icon: Icon, path }: any) => (
      <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-1 text-[8px] text-primary-green-dim font-mono tracking-widest mb-1">
              <Icon size={10} /> {label}
          </div>
          <div className="flex gap-1 h-3">
              {Array.from({ length: max }).map((_, i) => {
                  const isActive = i < level;
                  const isNext = i === level;
                  const isInteractable = isNext && canAfford;
                  return (
                      <button
                          key={i}
                          disabled={!isInteractable}
                          onClick={(e) => isInteractable && handleUpgrade(path, e)}
                          className={clsx(
                              "flex-1 h-full skew-x-[-20deg] border transition-colors",
                              isActive ? "bg-primary-green border-primary-green" : "bg-transparent border-primary-green/30",
                              isInteractable ? "hover:bg-primary-green/50 cursor-pointer animate-pulse border-primary-green" : ""
                          )}
                      />
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className={clsx("p-4 border border-primary-green/30 bg-black/40 relative overflow-hidden transition-all", isPanelDead ? "opacity-50 grayscale pointer-events-none" : "")}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b border-primary-green/20 pb-2">
            <div>
                <h3 className="text-lg font-header font-black text-primary-green tracking-widest">RAILGUN</h3>
                <span className="text-[9px] font-mono text-primary-green-dim">CLASS: KINETIC_BEAM</span>
            </div>
            <div className="text-xs font-bold text-primary-green bg-primary-green/10 px-2 py-1">
                MK.{1 + Math.floor((railgun.widthLevel + railgun.damageLevel + railgun.rateLevel) / 3)}
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <WidthBank />
            <div className="flex gap-4 w-full">
                <StatModule label="DAMAGE" level={railgun.damageLevel} max={3} icon={Swords} path="RAILGUN_DAMAGE" />
                <StatModule label="RATE" level={railgun.rateLevel} max={3} icon={Zap} path="RAILGUN_RATE" />
            </div>
        </div>

        {/* Decorative Circuit Lines */}
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(45deg, transparent 50%, ${PALETTE.GREEN.PRIMARY} 50%)` }} />
    </div>
  );
};
