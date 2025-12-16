import { useGameStore } from '@/engine/state/game/useGameStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { Zap, Swords, GitFork, Gitlab, DoorOpen, Bot, ArrowUpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UpgradeOption } from '@/engine/types/game.types';

const CORE_UPGRADES: UpgradeOption[] = ['OVERCLOCK', 'EXECUTE', 'FORK', 'SNIFFER', 'BACKDOOR', 'DAEMON'];

const UPGRADE_INFO: Partial<Record<UpgradeOption, { label: string, desc: string, icon: any }>> = {
  'OVERCLOCK': { label: 'Overclock', desc: 'Fire Rate ++', icon: Zap },
  'EXECUTE': { label: 'Execute', desc: 'Damage ++', icon: Swords },
  'FORK': { label: 'Fork', desc: 'Multishot ++', icon: GitFork }, 
  'SNIFFER': { label: 'Sniffer', desc: 'Homing', icon: Gitlab }, 
  'BACKDOOR': { label: 'Backdoor', desc: 'Rear Guard', icon: DoorOpen }, 
  'DAEMON': { label: 'Daemon', desc: 'Summon Ally', icon: Bot },
};

interface UpgradeTerminalProps {
  isPanelDead: boolean;
}

export const UpgradeTerminal = ({ isPanelDead }: UpgradeTerminalProps) => {
  const upgradePoints = useGameStore(s => s.upgradePoints);
  const activeUpgrades = useGameStore(s => s.activeUpgrades);
  const selectUpgrade = useGameStore(s => s.selectUpgrade);

  const handleUpgrade = (u: UpgradeOption, e: React.MouseEvent) => {
      if (isPanelDead || upgradePoints <= 0) return; 
      AudioSystem.playClick(getPan(e));
      selectUpgrade(u);
  };

  return (
    <AnimatePresence mode="wait">
      {upgradePoints > 0 ? (
        <motion.div 
            key="upgrades"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
        >
            <div className="flex items-center gap-2 pb-1 border-b border-primary-green/20 pt-2">
                <ArrowUpCircle size={12} className="text-primary-green animate-bounce" />
                <span className="text-[9px] font-bold text-primary-green tracking-widest">
                    SYSTEM_UPGRADE_AVAILABLE [{upgradePoints}]
                </span>
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-primary-green-dim/50 uppercase tracking-widest px-1">Kernel_Modules</span>
                {CORE_UPGRADES.map(u => {
                    const info = UPGRADE_INFO[u];
                    if (!info) return null;
                    
                    const Icon = info.icon;
                    const currentLvl = activeUpgrades[u] || 0;

                    return (
                        <button
                            key={u}
                            onClick={(e) => handleUpgrade(u, e)}
                            onMouseEnter={(e) => !isPanelDead && AudioSystem.playHover(getPan(e))}
                            className="group relative flex items-center justify-between p-2 border border-primary-green-dim/30 bg-black/40 hover:border-primary-green transition-all duration-200 overflow-hidden"
                        >
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out bg-primary-green opacity-20" />
                            
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-1.5 rounded-sm bg-primary-green/10 text-primary-green group-hover:bg-primary-green group-hover:text-black">
                                    <Icon size={14} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold font-header tracking-wider uppercase text-primary-green">
                                        {info.label}
                                    </span>
                                    <span className="text-[8px] text-gray-400 font-mono group-hover:text-white">
                                        {info.desc}
                                    </span>
                                </div>
                            </div>

                            <div className="text-[9px] font-mono text-primary-green-dim border border-primary-green-dim/30 px-1.5 py-0.5 rounded bg-black/50 group-hover:border-primary-green group-hover:text-primary-green relative z-10">
                                v{currentLvl}
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
      ) : (
        <motion.div 
            key="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col justify-center items-center text-center opacity-40 font-mono space-y-2 p-4 rounded bg-black/20 marching-ants [--ant-color:rgba(255,255,255,0.1)]"
        >
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center animate-spin-slow">
                <div className="w-1 h-1 bg-white/50 rounded-full" />
            </div>
            <span className="text-[9px] tracking-widest">SYSTEM_OPTIMIZED</span>
            <span className="text-[8px]">WAITING FOR DATA...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
