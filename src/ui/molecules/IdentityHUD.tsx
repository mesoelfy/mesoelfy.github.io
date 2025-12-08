import { MiniCrystalCanvas } from '@/scene/props/MiniCrystalCanvas';
import { useGameStore } from '@/game/store/useGameStore';
import { UpgradeOption } from '@/game/types/game.types';
import identity from '@/data/identity.json';
import { useStore } from '@/core/store/useStore'; 
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Unplug, Zap, AlertCircle, GitFork, Swords, Wifi, Zap as ZapIcon, LocateFixed, Gitlab, DoorOpen, Biohazard, CircleDotDashed } from 'lucide-react';

const UPGRADE_MAP: Record<string, { label: string, icon: any }> = {
  'OVERCLOCK': { label: 'Overclock', icon: ZapIcon },
  'EXECUTE': { label: 'Execute', icon: Swords },
  'BANDWIDTH': { label: 'Bandwidth', icon: Wifi },
  'FORK': { label: 'Fork', icon: GitFork }, 
  'SNIFFER': { label: 'Sniffer', icon: Gitlab }, 
  'BACKDOOR': { label: 'Backdoor', icon: DoorOpen }, 
  'PURGE': { label: 'Purge', icon: Biohazard },        // NEW
  'RESTORE': { label: 'Restore', icon: CircleDotDashed }, // NEW
  'REPAIR_NANITES': { label: 'Repair', icon: Unplug }
};

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
  
  const panel = useGameStore(s => s.panels['identity']);
  const isPanelDead = panel ? panel.isDestroyed : false;
  const isPlayerDead = hp <= 0;

  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  const xpPercent = nextXp > 0 ? Math.min(100, (xp / nextXp) * 100) : 0;

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

  // Available options
  const availableOptions: UpgradeOption[] = [
      'OVERCLOCK', 
      'FORK', 
      'BANDWIDTH', 
      'EXECUTE',
      'SNIFFER',
      'BACKDOOR',
      'PURGE',
      'RESTORE'
  ];

  const handleUpgrade = (u: UpgradeOption) => {
      if (isPanelDead || isPlayerDead) return; 
      AudioSystem.playClick();
      selectUpgrade(u);
  };

  return (
    <div className={`flex flex-col items-center h-full w-full relative ${isPanelDead ? 'grayscale opacity-50 pointer-events-none' : ''}`}>
      
      <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0 mt-2 group mb-6"> 
        <div className={`absolute inset-0 rounded-full bg-black/50 overflow-hidden transition-opacity duration-500 ${isPlayerDead ? 'opacity-60 grayscale' : 'opacity-100'}`}>
           <MiniCrystalCanvas />
        </div>

        {isPlayerDead && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {rebootProgress > 0 ? (
                    <span className="text-2xl font-header font-black text-elfy-yellow drop-shadow-md animate-pulse">
                        {Math.floor(rebootProgress)}%
                    </span>
                ) : (
                    <div className="animate-pulse">
                        <Unplug className="text-white/50 w-8 h-8" />
                    </div>
                )}
            </div>
        )}

        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radiusHp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" />
          <circle cx={center} cy={center} r={radiusXp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" strokeDasharray="4 4" />
          
          <circle 
            cx={center} cy={center} r={radiusHp} 
            stroke={displayHpColor} 
            strokeWidth={stroke} fill="transparent"
            strokeDasharray={circHp}
            strokeDashoffset={offsetHp}
            strokeLinecap="round"
            className="transition-all duration-100 ease-linear"
          />
          <circle 
            cx={center} cy={center} r={radiusXp} 
            stroke="#9E4EA5" 
            strokeWidth={stroke} fill="transparent"
            strokeDasharray={circXp}
            strokeDashoffset={offsetXp}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black border border-elfy-purple text-elfy-purple px-2 py-0.5 text-[9px] font-bold font-mono rounded-full shadow-[0_-2px_10px_rgba(158,78,165,0.4)] z-20">
          LVL_{level}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center w-full gap-2 py-1 min-h-0">
        
        {isPlayerDead && !isPanelDead ? (
            <div className="bg-black/80 border border-elfy-yellow/50 px-4 py-2 rounded animate-pulse text-center relative z-50">
                <div className="flex items-center justify-center gap-2 text-elfy-yellow font-bold text-xs mb-1">
                    <Zap size={14} />
                    <span>SYSTEM CRITICAL</span>
                </div>
                <p className="text-[9px] text-white font-mono">HOLD TO REBOOT</p>
                <p className="text-[8px] text-elfy-red mt-1 font-bold">TAKING DAMAGE DRAINS POWER</p>
            </div>
        ) : (
            <div className="text-center">
              <h2 className="text-2xl font-header font-black text-elfy-green tracking-wider">{identity.name}</h2>
              <div className="text-[9px] text-elfy-purple-light uppercase tracking-widest opacity-80">{identity.class}</div>
            </div>
        )}

        {upgradePoints > 0 && !isPlayerDead && (
          <div className="w-full bg-elfy-purple-deep/40 border border-elfy-purple/50 p-1.5 rounded-sm pointer-events-auto z-50 animate-pulse">
            <div className="flex items-center justify-center gap-2 mb-1">
                <AlertCircle size={10} className="text-elfy-green" />
                <div className="text-[9px] text-white text-center font-bold tracking-widest">
                  UPGRADE AVAILABLE ({upgradePoints})
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              {availableOptions.map(u => {
                const info = UPGRADE_MAP[u] || { label: u, icon: Zap };
                const Icon = info.icon;
                return (
                  <button 
                    key={u}
                    className={`flex items-center justify-center gap-1 text-[8px] bg-elfy-purple/20 border border-elfy-purple/50 text-elfy-green font-mono py-1.5 transition-colors uppercase ${isPanelDead ? 'cursor-not-allowed text-gray-500' : 'hover:bg-elfy-purple hover:text-white'}`}
                    onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
                    onClick={() => handleUpgrade(u)}
                  >
                    <Icon size={8} />
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-2 gap-3 mt-auto pt-2 border-t border-elfy-green-dim/10">
        <button 
          onClick={() => !isPanelDead && openModal('about')} 
          onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
          className="py-2 bg-elfy-purple-deep/20 border border-elfy-purple text-elfy-purple-light hover:bg-elfy-purple hover:text-black transition-all font-bold text-xs font-header uppercase clip-corner-btn"
        >
          About
        </button>
        <button 
          onClick={() => !isPanelDead && openModal('contact')} 
          onMouseEnter={() => !isPanelDead && AudioSystem.playHover()}
          className="py-2 bg-elfy-yellow/5 border border-elfy-yellow text-elfy-yellow hover:bg-elfy-yellow hover:text-black transition-all font-bold text-xs font-header uppercase clip-corner-btn"
        >
          Contact
        </button>
      </div>
    </div>
  );
};
