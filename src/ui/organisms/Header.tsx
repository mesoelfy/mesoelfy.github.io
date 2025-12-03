import { Volume2, VolumeX } from 'lucide-react';
import { useStore } from '@/core/store/useStore';

export const Header = () => {
  const { musicEnabled, toggleMusic } = useStore();

  return (
    <header className="w-full h-12 border-b border-elfy-green-dim/30 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <span className="font-mono font-bold text-elfy-green text-lg tracking-tight drop-shadow-[0_0_5px_rgba(120,246,84,0.5)]">
          MESOELFY_OS
        </span>
        <div className="flex items-center gap-2">
          {/* UPDATED: Red Pulse for "Unsafe" story */}
          <div className="w-2 h-2 bg-elfy-red rounded-full animate-pulse shadow-[0_0_8px_#ff003c]" />
          <span className="text-[10px] text-elfy-red font-bold tracking-wider uppercase">UNSECURE</span>
        </div>
      </div>

      {/* Right */}
      <button 
        onClick={toggleMusic}
        className="flex items-center gap-2 text-xs font-mono text-elfy-green-dim hover:text-elfy-green transition-colors"
      >
        <span>AUDIO: [{musicEnabled ? 'ON' : 'OFF'}]</span>
        {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
    </header>
  );
};
