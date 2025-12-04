import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';

export const Header = () => {
  const { musicEnabled, toggleMusic } = useStore();

  const handleToggle = () => {
      AudioSystem.playClick();
      toggleMusic();
      // Apply mute state immediately
      AudioSystem.setMute(!musicEnabled ? false : true); 
  };

  return (
    <header className="w-full h-12 border-b border-elfy-green-dim/30 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <span className="font-header font-black text-elfy-green text-xl md:text-2xl tracking-wide drop-shadow-[0_0_5px_rgba(120,246,84,0.5)]">
          MESOELFY_OS
        </span>
        
        {/* Unsecure Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-elfy-red/40 bg-elfy-red/5 rounded-full shadow-[0_0_10px_rgba(255,0,60,0.1)]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-elfy-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-elfy-red"></span>
          </div>
          <span className="text-[10px] text-elfy-red font-bold tracking-widest uppercase leading-none">
            SYSTEM_UNSECURE
          </span>
        </div>
        
        {/* Mobile simplified version */}
        <div className="md:hidden w-3 h-3 bg-elfy-red rounded-full animate-pulse shadow-[0_0_8px_#ff003c]" />
      </div>

      <button 
        onClick={handleToggle}
        onMouseEnter={() => AudioSystem.playHover()} // ADDED SFX
        className="flex items-center gap-2 text-xs font-mono text-elfy-green-dim hover:text-elfy-green transition-colors"
      >
        <span className="hidden md:inline">AUDIO: [{musicEnabled ? 'ON' : 'OFF'}]</span>
        <span className="md:hidden">[{musicEnabled ? 'ON' : 'OFF'}]</span>
        {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
    </header>
  );
};
