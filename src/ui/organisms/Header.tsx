import { Volume2, VolumeX, Radio } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useEffect, useState } from 'react';

export const Header = () => {
  const { musicEnabled, toggleMusic } = useStore();
  
  // Global System Integrity (The Footer Bar replacement)
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const score = useGameStore(state => state.score);

  // Client-side init
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleToggle = () => {
      AudioSystem.playClick();
      toggleMusic();
      AudioSystem.setMute(!musicEnabled ? false : true); 
  };

  // Integrity Bar Logic
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
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-elfy-green-dim border-l border-elfy-green-dim/20 pl-4">
            <span>SCORE:</span>
            <span className="text-elfy-green">{score.toString().padStart(6, '0')}</span>
          </div>
        )}
      </div>

      {/* RIGHT: Status */}
      <div className="flex items-center gap-6">
        <button 
          onClick={handleToggle}
          onMouseEnter={() => AudioSystem.playHover()}
          className="flex items-center gap-2 text-xs font-mono text-elfy-green-dim hover:text-elfy-green transition-colors pl-4 border-l border-elfy-green-dim/20"
        >
          {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      {/* BOTTOM BORDER: OS INTEGRITY BAR */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900">
        <div 
          className={`h-full transition-all duration-500 ease-out ${integrityColor} shadow-[0_0_10px_currentColor]`} 
          style={{ width: `${systemIntegrity}%` }}
        />
      </div>
      
      {/* Integrity Label (Floating) */}
      <div className="absolute bottom-[-14px] right-2 text-[8px] font-mono text-elfy-green-dim flex items-center gap-1">
        <Radio size={8} className={systemIntegrity < 100 ? "animate-pulse text-elfy-red" : ""} />
        <span>OS_INTEGRITY: {Math.floor(systemIntegrity)}%</span>
      </div>

    </header>
  );
};
