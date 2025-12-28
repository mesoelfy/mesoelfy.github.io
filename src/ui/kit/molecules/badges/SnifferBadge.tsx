import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Zap, Swords, GitFork } from 'lucide-react';
import { clsx } from 'clsx';
import { PALETTE } from '@/engine/config/Palette';

interface SnifferBadgeProps {
  isPanelDead: boolean;
}

export const SnifferBadge = ({ isPanelDead }: SnifferBadgeProps) => {
  const { sniffer, upgradePoints, selectUpgrade } = useGameStore(state => ({
    sniffer: state.sniffer,
    upgradePoints: state.upgradePoints,
    selectUpgrade: state.selectUpgrade
  }));

  const handleUpgrade = (path: any, e: React.MouseEvent) => {
    if (isPanelDead || upgradePoints <= 0) return;
    selectUpgrade(path);
    AudioSystem.playClick(getPan(e));
  };

  const canAfford = upgradePoints > 0;

  // --- RETICLE VISUALIZER ---
  const ReticleCore = () => {
      // 4 Corners: TL, TR, BR, BL
      const corners = [0, 1, 3, 2]; 
      
      return (
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center border border-latent-purple/20 rounded-full bg-black/40">
              {/* Central Hub */}
              <div className="absolute inset-2 border border-latent-purple/10 rounded-full" />
              <div className="absolute inset-6 border border-latent-purple/10 rounded-full" />
              
              {/* Corner Slots */}
              {corners.map((mappedIndex, visualIndex) => {
                  // i is the logical level index (0-3)
                  // Visual placement handles position
                  const isActive = mappedIndex < sniffer.capacityLevel;
                  const isNext = mappedIndex === sniffer.capacityLevel;
                  const isInteractable = isNext && canAfford;

                  let posClass = "";
                  if (visualIndex === 0) posClass = "top-0 left-0 -translate-x-1/3 -translate-y-1/3";
                  if (visualIndex === 1) posClass = "top-0 right-0 translate-x-1/3 -translate-y-1/3";
                  if (visualIndex === 2) posClass = "bottom-0 right-0 translate-x-1/3 translate-y-1/3";
                  if (visualIndex === 3) posClass = "bottom-0 left-0 -translate-x-1/3 translate-y-1/3";

                  return (
                      <button
                          key={mappedIndex}
                          disabled={!isInteractable}
                          onClick={(e) => isInteractable && handleUpgrade('SNIFFER_CAPACITY', e)}
                          className={clsx(
                              "absolute w-8 h-8 border-2 transition-all duration-300 rounded-full flex items-center justify-center",
                              posClass,
                              isActive 
                                  ? "bg-latent-purple border-latent-purple shadow-[0_0_10px_#9E4EA5]" 
                                  : "bg-black border-latent-purple/30",
                              isInteractable 
                                  ? "hover:bg-latent-purple/50 animate-pulse cursor-pointer border-latent-purple" 
                                  : "cursor-default"
                          )}
                      >
                          {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                      </button>
                  );
              })}
              
              {/* Center Icon */}
              <GitFork className="text-latent-purple opacity-50" size={24} />
          </div>
      );
  };

  const StatRow = ({ label, level, max, icon: Icon, path }: any) => (
      <div className="flex items-center gap-2 w-full">
          <div className="w-4 flex justify-center"><Icon size={12} className="text-latent-purple" /></div>
          <div className="flex-1 flex gap-1 h-2">
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
                              "flex-1 h-full rounded-[1px] transition-colors",
                              isActive ? "bg-latent-purple" : "bg-latent-purple/10",
                              isInteractable ? "hover:bg-latent-purple/60 cursor-pointer animate-pulse bg-latent-purple/30" : ""
                          )}
                      />
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className={clsx("p-4 border border-latent-purple/30 bg-black/40 relative overflow-hidden transition-all", isPanelDead ? "opacity-50 grayscale pointer-events-none" : "")}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b border-latent-purple/20 pb-2">
            <div>
                <h3 className="text-lg font-header font-black text-latent-purple tracking-widest">SNIFFER</h3>
                <span className="text-[9px] font-mono text-latent-purple-light">CLASS: HOMING_SWARM</span>
            </div>
            <div className="text-xs font-bold text-latent-purple bg-latent-purple/10 px-2 py-1">
                MK.{1 + Math.floor((sniffer.capacityLevel + sniffer.damageLevel + sniffer.rateLevel) / 3)}
            </div>
        </div>

        <div className="flex flex-row items-center gap-6">
            {/* Left: Reticle */}
            <div className="shrink-0 pl-2">
                <ReticleCore />
            </div>

            {/* Right: Stats */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="space-y-1">
                    <span className="text-[8px] font-bold text-latent-purple-light tracking-widest ml-6">DAMAGE_OUTPUT</span>
                    <StatRow label="DMG" level={sniffer.damageLevel} max={3} icon={Swords} path="SNIFFER_DAMAGE" />
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] font-bold text-latent-purple-light tracking-widest ml-6">CYCLE_RATE</span>
                    <StatRow label="SPD" level={sniffer.rateLevel} max={3} icon={Zap} path="SNIFFER_RATE" />
                </div>
            </div>
        </div>
    </div>
  );
};
