import { Volume2, VolumeX, Radio, Trophy, Skull, Music } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

// SUB-COMPONENTS for Audio Controls
const SfxBtn = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center justify-center px-1.5 py-1 transition-all duration-200 border border-transparent rounded-sm font-mono text-[10px] font-bold tracking-tighter",
      active 
        ? "text-elfy-green hover:text-elfy-yellow bg-elfy-green/10 border-elfy-green/20" 
        : "text-elfy-green-dim/30 hover:text-elfy-red decoration-line-through"
    )}
  >
    SFX
  </button>
);

const AudioBtn = ({ active, onClick, icon: Icon, offIcon: OffIcon }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center justify-center p-1.5 transition-all duration-200 border border-transparent rounded-sm",
      active 
        ? "text-elfy-green hover:text-elfy-yellow bg-elfy-green/5" 
        : "text-elfy-green-dim/30 hover:text-elfy-red"
    )}
  >
    {active ? <Icon size={14} /> : <OffIcon size={14} />}
  </button>
);

export const Header = () => {
  const { audioSettings, toggleMaster, toggleMusic, toggleSfx } = useStore();
  
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const score = useGameStore(state => state.score);
  const highScore = useGameStore(state => state.highScore);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  let integrityColor = "bg-elfy-green";
  if (systemIntegrity < 40) integrityColor = "bg-elfy-red";
  else if (systemIntegrity < 70) integrityColor = "bg-elfy-yellow";

  return (
    <header className="relative w-full h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0">
      
      {/* LEFT: Identity */}
      <div className="flex items-center gap-4">
        <span className="font-header font-black text-elfy-green text-xl md:text-2xl tracking-wide drop-shadow-[0_0_5px_rgba(120,246,84,0.5)]">
          MESOELFY_OS
        </span>
        
        {mounted && (
          <div className="hidden md:flex items-center gap-6 text-xs font-mono border-l border-elfy-green-dim/20 pl-4">
            
            {/* CURRENT KILLS */}
            <div className="flex items-center gap-2 text-elfy-green" title="Current Session Kills">
              <Skull size={14} />
              <span className="opacity-70">KILLS:</span>
              <span className="font-bold">{score.toString().padStart(4, '0')}</span>
            </div>

            {/* MAX KILLS */}
            <div className="flex items-center gap-2 text-elfy-yellow" title="All-Time Max Kills">
              <Trophy size={14} />
              <span className="opacity-70">MAX:</span>
              <span className="font-bold">{highScore.toString().padStart(4, '0')}</span>
            </div>

          </div>
        )}
      </div>

      {/* RIGHT: Status & Audio Controls */}
      <div className="flex items-center gap-4">
        
        {/* Audio Group */}
        <div className="flex items-center gap-1 border-l border-elfy-green-dim/20 pl-4">
            <SfxBtn active={audioSettings.sfx} onClick={toggleSfx} />
            
            <AudioBtn 
                active={audioSettings.music} 
                onClick={toggleMusic} 
                icon={Music} 
                offIcon={Music}
            />

            <div className="w-[1px] h-4 bg-elfy-green-dim/20 mx-1" />

            <AudioBtn 
                active={audioSettings.master} 
                onClick={toggleMaster} 
                icon={Volume2} 
                offIcon={VolumeX} 
            />
        </div>
      </div>

      {/* BOTTOM BORDER: OS INTEGRITY BAR */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900">
        <div 
          className={`h-full transition-all duration-500 ease-out ${integrityColor} shadow-[0_0_10px_currentColor]`} 
          style={{ width: `${systemIntegrity}%` }}
        />
      </div>
      
      <div className="absolute bottom-[-14px] right-2 text-[8px] font-mono text-elfy-green-dim flex items-center gap-1">
        <Radio size={8} className={systemIntegrity < 100 ? "animate-pulse text-elfy-red" : ""} />
        <span>OS_INTEGRITY: {Math.floor(systemIntegrity)}%</span>
      </div>

    </header>
  );
};
