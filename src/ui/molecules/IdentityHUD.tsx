import { MiniCrystalCanvas } from '@/scene/props/MiniCrystalCanvas';
import { useGameStore, UpgradeOption } from '@/game/store/useGameStore';
import identity from '@/data/identity.json';
import { useStore } from '@/core/store/useStore'; 
import { AudioSystem } from '@/core/audio/AudioSystem';

export const IdentityHUD = () => {
  const { openModal } = useStore();
  
  // Game State
  const hp = useGameStore(s => s.playerHealth);
  const maxHp = useGameStore(s => s.maxPlayerHealth);
  const xp = useGameStore(s => s.xp);
  const nextXp = useGameStore(s => s.xpToNextLevel);
  const level = useGameStore(s => s.level);
  const upgrades = useGameStore(s => s.availableUpgrades);
  const selectUpgrade = useGameStore(s => s.selectUpgrade); // ACTION

  const hpPercent = Math.max(0, (hp / maxHp) * 100);
  const xpPercent = Math.min(100, (xp / nextXp) * 100);

  // SVG Config
  const size = 160; 
  const center = size / 2;
  const radiusHp = 60;
  const radiusXp = 70;
  const stroke = 4;
  
  const circHp = 2 * Math.PI * radiusHp;
  const circXp = 2 * Math.PI * radiusXp;

  const offsetHp = circHp - (hpPercent / 100 * circHp);
  const offsetXp = circXp - (xpPercent / 100 * circXp);

  const isLowHp = hpPercent < 30;
  const isDead = hp <= 0;

  const handleUpgrade = (u: UpgradeOption) => {
      AudioSystem.playClick();
      selectUpgrade(u);
  };

  return (
    <div className="flex flex-col items-center h-full w-full relative">
      
      {/* 1. THE AVATAR (Top) */}
      <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0 mt-2">
        <div className={`absolute inset-0 rounded-full bg-black/50 overflow-hidden transition-opacity duration-500 ${isDead ? 'opacity-20 grayscale' : 'opacity-100'}`}>
           <MiniCrystalCanvas />
        </div>

        {/* HUD RINGS */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox={`0 0 ${size} ${size}`}>
          {/* Tracks */}
          <circle cx={center} cy={center} r={radiusHp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" />
          <circle cx={center} cy={center} r={radiusXp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" strokeDasharray="4 4" />
          
          {/* Values */}
          <circle 
            cx={center} cy={center} r={radiusHp} 
            stroke={isLowHp ? "#FF003C" : "#78F654"} 
            strokeWidth={stroke} fill="transparent"
            strokeDasharray={circHp}
            strokeDashoffset={offsetHp}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
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

        {/* Level Badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black border border-elfy-purple text-elfy-purple px-3 py-0.5 text-[10px] font-bold font-mono rounded-full shadow-[0_0_10px_rgba(158,78,165,0.4)]">
          LVL_{level}
        </div>
      </div>

      {/* 2. INFO & UPGRADES (Middle - Flexible Space) */}
      <div className="flex-1 flex flex-col justify-center items-center w-full gap-2 py-2 min-h-0">
        
        {/* Name */}
        <div className="text-center">
          <h2 className="text-2xl font-header font-black text-elfy-green tracking-wider">{identity.name}</h2>
          <div className="text-[9px] text-elfy-purple-light uppercase tracking-widest opacity-80">{identity.class}</div>
        </div>

        {/* UPGRADE MODULE */}
        {upgrades.length > 0 && (
          <div className="w-full bg-elfy-purple-deep/40 border border-elfy-purple/50 p-1.5 animate-pulse rounded-sm pointer-events-auto z-50">
            <div className="text-[8px] text-elfy-purple-light text-center mb-1 font-bold tracking-widest">
              [ SYSTEM UPGRADE AVAILABLE ]
            </div>
            <div className="grid grid-cols-2 gap-1">
              {upgrades.map(u => (
                <button 
                  key={u}
                  className="text-[8px] bg-elfy-purple/20 border border-elfy-purple/50 text-elfy-green font-mono py-1 hover:bg-elfy-purple hover:text-white transition-colors uppercase"
                  onMouseEnter={() => AudioSystem.playHover()}
                  onClick={() => handleUpgrade(u)}
                >
                  {u.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. NAVIGATION (Bottom - Pinned) */}
      <div className="w-full grid grid-cols-2 gap-3 mt-auto pt-2 border-t border-elfy-green-dim/10">
        <button 
          onClick={() => openModal('about')} 
          onMouseEnter={() => AudioSystem.playHover()}
          className="py-2 bg-elfy-purple-deep/20 border border-elfy-purple text-elfy-purple-light hover:bg-elfy-purple hover:text-black transition-all font-bold text-xs font-header uppercase clip-corner-btn"
        >
          About
        </button>
        <button 
          onClick={() => openModal('contact')} 
          onMouseEnter={() => AudioSystem.playHover()}
          className="py-2 bg-elfy-yellow/5 border border-elfy-yellow text-elfy-yellow hover:bg-elfy-yellow hover:text-black transition-all font-bold text-xs font-header uppercase clip-corner-btn"
        >
          Contact
        </button>
      </div>
    </div>
  );
};
