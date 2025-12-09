import { MiniCrystalCanvas } from '@/scene/props/MiniCrystalCanvas';
import { useGameStore } from '@/game/store/useGameStore';
import { UpgradeOption } from '@/game/types/game.types';
import identity from '@/data/identity.json';
import { useStore } from '@/core/store/useStore'; 
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Unplug, Zap, GitFork, Swords, Wifi, Zap as ZapIcon, Gitlab, DoorOpen, Biohazard, CircleDotDashed, Bot, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const UPGRADE_MAP: Record<string, { label: string, desc: string, icon: any }> = {
  // CORE UPGRADES
  'OVERCLOCK': { label: 'Overclock', desc: 'Fire Rate ++', icon: ZapIcon },
  'EXECUTE': { label: 'Execute', desc: 'Damage ++', icon: Swords },
  'BANDWIDTH': { label: 'Bandwidth', desc: 'Size ++', icon: Wifi },
  'FORK': { label: 'Fork', desc: 'Multishot ++', icon: GitFork }, 
  'SNIFFER': { label: 'Sniffer', desc: 'Homing', icon: Gitlab }, 
  'BACKDOOR': { label: 'Backdoor', desc: 'Rear Guard', icon: DoorOpen }, 
  'DAEMON': { label: 'Daemon', desc: 'Summon Ally', icon: Bot },
  
  // ACTIONS / OPS
  'PURGE': { label: 'Purge', desc: 'Nuke Screen', icon: Biohazard },
  'RESTORE': { label: 'Restore', desc: 'Heal System', icon: CircleDotDashed },
  'REPAIR_NANITES': { label: 'Repair', desc: 'Heal Self', icon: Unplug }
};

const CORE_UPGRADES: UpgradeOption[] = ['OVERCLOCK', 'EXECUTE', 'BANDWIDTH', 'FORK', 'SNIFFER', 'BACKDOOR', 'DAEMON'];
const SYSTEM_OPS: UpgradeOption[] = ['REPAIR_NANITES', 'RESTORE', 'PURGE'];

export const IdentityHUD = () => {
  const { openModal } = useStore();
  
  const hp = useGameStore(s => s.playerHealth);
  const maxHp = useGameStore(s => s.maxPlayerHealth);
  const xp = useGameStore(s => s.xp);
  const nextXp = useGameStore(s => s.xpToNextLevel);
  const level = useGameStore(s => s.level);
  
  const upgradePoints = useGameStore(s => s.upgradePoints);
  const selectUpgrade = useGameStore(s => s.selectUpgrade);
  const rebootProgress = useGameStore(s => s.playerRebootProgress);
  const activeUpgrades = useGameStore(s => s.activeUpgrades);
  
  const panel = useGameStore(s => s.panels['identity']);
  const isPanelDead = panel ? panel.isDestroyed : false;
  const isPlayerDead = hp <= 0;

  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  const xpPercent = nextXp > 0 ? Math.min(100, (xp / nextXp) * 100) : 0;

  // --- SVG CONFIG ---
  const size = 160; 
  const center = size / 2;
  const radiusHp = 60;
  const radiusXp = 70;
  const stroke = 4;
  
  const circHp = 2 * Math.PI * radiusHp;
  const circXp = 2 * Math.PI * radiusXp;

  const displayHpPercent = isPlayerDead ? rebootProgress : hpPercent;
  const displayHpColor = isPlayerDead ? "#eae747" : (hpPercent < 30 ? "#FF003C" : "#78F654"); 

  const offsetHp = circHp - (displayHpPercent / 100 * circHp);
  const offsetXp = circXp - (xpPercent / 100 * circXp);

  const handleUpgrade = (u: UpgradeOption) => {
      if (isPanelDead || isPlayerDead) return; 
      AudioSystem.playClick();
      selectUpgrade(u);
  };

  return (
    <div className={`flex flex-col h-full w-full relative overflow-hidden ${isPanelDead ? 'grayscale opacity-50 pointer-events-none' : ''}`}>
      
      {/* TOP SECTION: Avatar & Stats */}
      <div className="flex-none flex flex-col items-center pt-4 relative z-10">
        
        {/* AVATAR RING */}
        <div className="relative w-40 h-40 shrink-0 group mb-1"> 
            
            {/* 3D Canvas */}
            <div className={`absolute inset-0 rounded-full bg-black/50 overflow-hidden transition-opacity duration-500 clip-circle ${isPlayerDead ? 'opacity-60 grayscale' : 'opacity-100'}`}>
               <MiniCrystalCanvas />
            </div>

            {/* Status Overlays */}
            {isPlayerDead && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {rebootProgress > 0 ? (
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-header font-black text-elfy-yellow drop-shadow-md animate-pulse">
                                {Math.floor(rebootProgress)}%
                            </span>
                            <span className="text-[8px] text-elfy-yellow font-mono tracking-widest bg-black/80 px-2 mt-1">REBOOTING</span>
                        </div>
                    ) : (
                        <div className="animate-pulse flex flex-col items-center">
                            <Unplug className="text-white/50 w-8 h-8 mb-1" />
                            <span className="text-[8px] text-elfy-red font-mono bg-black/80 px-2">SIGNAL_LOST</span>
                        </div>
                    )}
                </div>
            )}

            {/* SVG RINGS */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`0 0 ${size} ${size}`}>
              <circle cx={center} cy={center} r={radiusHp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" />
              <circle cx={center} cy={center} r={radiusXp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" strokeDasharray="2 4" />
              
              <circle 
                cx={center} cy={center} r={radiusHp} 
                stroke={displayHpColor} 
                strokeWidth={stroke} fill="transparent"
                strokeDasharray={circHp}
                strokeDashoffset={offsetHp}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-100 ease-linear"
              />
              
              <circle 
                cx={center} cy={center} r={radiusXp} 
                stroke="#9E4EA5" 
                strokeWidth={stroke} fill="transparent"
                strokeDasharray={circXp}
                strokeDashoffset={offsetXp}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-500 ease-out"
              />

              <defs>
                  <path id="levelCurve" d="M 25,80 A 55,55 0 0,0 135,80" /> 
              </defs>
              
              <text fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="3" fill="#9E4EA5" style={{ filter: 'drop-shadow(0 0 2px #9E4EA5)' }}>
                  <textPath href="#levelCurve" startOffset="50%" textAnchor="middle" side="right">
                      LVL_{level.toString().padStart(2, '0')}
                  </textPath>
              </text>
            </svg>
        </div>

        {/* Identity Info */}
        <div className="text-center z-20 mb-2">
            <h2 className="text-xl font-header font-black text-elfy-green tracking-wider drop-shadow-md">{identity.name}</h2>
            <div className="text-[8px] text-elfy-purple-light uppercase tracking-[0.2em] opacity-80 bg-black/60 px-2 py-0.5 rounded-full border border-elfy-purple/20">
                {identity.class}
            </div>
        </div>
      </div>

      {/* MIDDLE SECTION: Upgrade Terminal */}
      <div className="flex-1 min-h-0 w-full px-4 overflow-y-auto scrollbar-hide relative pb-4">
         <AnimatePresence mode="wait">
            {upgradePoints > 0 && !isPlayerDead ? (
                <motion.div 
                    key="upgrades"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex items-center gap-2 pb-1 border-b border-elfy-green/20 pt-2">
                        <ArrowUpCircle size={12} className="text-elfy-green animate-bounce" />
                        <span className="text-[9px] font-bold text-elfy-green tracking-widest">
                            SYSTEM_UPGRADE_AVAILABLE [{upgradePoints}]
                        </span>
                    </div>

                    {/* KERNEL UPGRADES */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-bold text-elfy-green-dim/50 uppercase tracking-widest px-1">Kernel_Modules</span>
                        {CORE_UPGRADES.map(u => {
                            const info = UPGRADE_MAP[u];
                            const Icon = info.icon;
                            const currentLvl = activeUpgrades[u] || 0;

                            return (
                                <button
                                    key={u}
                                    onClick={() => handleUpgrade(u)}
                                    onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
                                    className="group relative flex items-center justify-between p-2 border border-elfy-green-dim/30 bg-black/40 hover:border-elfy-green transition-all duration-200 overflow-hidden"
                                >
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out bg-elfy-green opacity-20" />
                                    
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="p-1.5 rounded-sm bg-elfy-green/10 text-elfy-green group-hover:bg-elfy-green group-hover:text-black">
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold font-header tracking-wider uppercase text-elfy-green">
                                                {info.label}
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-mono group-hover:text-white">
                                                {info.desc}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-[9px] font-mono text-elfy-green-dim border border-elfy-green-dim/30 px-1.5 py-0.5 rounded bg-black/50 group-hover:border-elfy-green group-hover:text-elfy-green relative z-10">
                                        v{currentLvl}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* SYSTEM OPS */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-bold text-elfy-yellow/50 uppercase tracking-widest px-1">System_Ops</span>
                        {SYSTEM_OPS.map(u => {
                            const info = UPGRADE_MAP[u];
                            const Icon = info.icon;
                            
                            return (
                                <button
                                    key={u}
                                    onClick={() => handleUpgrade(u)}
                                    onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
                                    className="group relative flex items-center justify-between p-2 border border-elfy-yellow/30 bg-elfy-yellow/5 hover:border-elfy-yellow transition-all duration-200 overflow-hidden"
                                >
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out bg-elfy-yellow opacity-20" />
                                    
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="p-1.5 rounded-sm bg-elfy-yellow/10 text-elfy-yellow group-hover:bg-elfy-yellow group-hover:text-black">
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold font-header tracking-wider uppercase text-elfy-yellow">
                                                {info.label}
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-mono group-hover:text-white">
                                                {info.desc}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <AlertTriangle size={12} className="text-elfy-yellow/50 group-hover:text-elfy-yellow" />
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
                    // UPDATED: Marching ants container
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
      </div>

      {/* BOTTOM SECTION: Footer Links */}
      <div className="flex-none grid grid-cols-2 gap-px bg-elfy-green-dim/20 border-t border-elfy-green-dim/30 mt-auto">
        <button 
          onClick={() => !isPanelDead && openModal('about')} 
          onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
          className="py-3 bg-black/80 hover:bg-elfy-green hover:text-black text-elfy-green text-[10px] font-bold font-header uppercase transition-colors tracking-widest"
        >
          About_Me
        </button>
        <button 
          onClick={() => !isPanelDead && openModal('contact')} 
          onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
          className="py-3 bg-black/80 hover:bg-elfy-yellow hover:text-black text-elfy-yellow text-[10px] font-bold font-header uppercase transition-colors tracking-widest"
        >
          Contact_Link
        </button>
      </div>
    </div>
  );
};
