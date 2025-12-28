import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Biohazard, CircleDotDashed, AlertTriangle } from 'lucide-react';
import { UpgradePath } from '@/engine/types/game.types';

// Updated: Removed REPAIR_NANITES
const SYSTEM_OPS: UpgradePath[] = ['RESTORE', 'PURGE'];

const OP_INFO: Record<string, { label: string, desc: string, icon: any }> = {
  'PURGE': { label: 'Purge', desc: 'Nuke Screen', icon: Biohazard },
  'RESTORE': { label: 'Restore', desc: 'Heal System', icon: CircleDotDashed },
};

interface SystemOpsProps {
  isPanelDead: boolean;
}

export const SystemOps = ({ isPanelDead }: SystemOpsProps) => {
  // Purge/Restore don't necessarily cost "points" in the new design logic unless specified.
  // The prompt implies Purge is the Zen Bomb.
  // Restore is the button.
  // We'll keep them as clickable buttons.
  // Note: Previous logic checked upgradePoints. If these are free cooldowns now, we remove check.
  // User said "restore... behave like presently does" -> Presently it costs an Upgrade Point.
  // So we KEEP the point check.
  
  const upgradePoints = useGameStore(s => s.upgradePoints);
  const selectUpgrade = useGameStore(s => s.selectUpgrade);

  const handleUpgrade = (u: UpgradePath, e: React.MouseEvent) => {
      if (isPanelDead || upgradePoints <= 0) return; 
      AudioSystem.playClick(getPan(e));
      selectUpgrade(u);
  };

  if (upgradePoints <= 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-4 border-t border-white/10 pt-4">
        <span className="text-[8px] font-bold text-alert-yellow/50 uppercase tracking-widest px-1">System_Ops</span>
        {SYSTEM_OPS.map(u => {
            const info = OP_INFO[u];
            const Icon = info.icon;
            
            return (
                <button
                    key={u}
                    onClick={(e) => handleUpgrade(u, e)}
                    onMouseEnter={(e) => !isPanelDead && AudioSystem.playHover(getPan(e))}
                    className="group relative flex items-center justify-between p-2 border border-alert-yellow/30 bg-alert-yellow/5 hover:border-alert-yellow transition-all duration-200 overflow-hidden"
                >
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out bg-alert-yellow opacity-20" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-1.5 rounded-sm bg-alert-yellow/10 text-alert-yellow group-hover:bg-alert-yellow group-hover:text-black">
                            <Icon size={14} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold font-header tracking-wider uppercase text-alert-yellow">
                                {info.label}
                            </span>
                            <span className="text-[8px] text-gray-400 font-mono group-hover:text-white">
                                {info.desc}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-alert-yellow bg-black/50 px-1.5 py-0.5 rounded border border-alert-yellow/30">1 PT</span>
                    </div>
                </button>
            );
        })}
    </div>
  );
};
