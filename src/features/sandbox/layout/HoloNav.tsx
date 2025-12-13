import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Speaker, Crosshair, ScanEye, Box } from 'lucide-react';
import { clsx } from 'clsx';

type View = 'audio' | 'arena' | 'gallery';

export const HoloNav = () => {
  const { sandboxView, setSandboxView } = useStore();

  const handleNav = (view: View) => {
    if (sandboxView === view) return;
    setSandboxView(view);
    AudioSystem.playSound('ui_click');
  };

  const NavItem = ({ id, label, icon: Icon }: { id: View, label: string, icon: any }) => {
    const isActive = sandboxView === id;
    return (
      <button
        onClick={() => handleNav(id)}
        onMouseEnter={() => !isActive && AudioSystem.playHover()}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 border-b-2 transition-all duration-200 group relative overflow-hidden",
          isActive 
            ? "border-service-cyan text-service-cyan bg-service-cyan/10" 
            : "border-transparent text-service-cyan/40 hover:text-service-cyan hover:bg-service-cyan/5"
        )}
      >
        <Icon size={16} className={clsx("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
        <span className="font-mono font-bold text-xs tracking-widest">{label}</span>
        
        {/* Active Indicator */}
        {isActive && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-service-cyan shadow-[0_0_10px_#00F0FF]" />
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm border-b border-service-cyan/20 px-6">
      <div className="mr-8 flex items-center gap-2 text-service-cyan opacity-80 py-3">
        <Box size={20} />
        <span className="font-header font-black tracking-widest">HOLO_DECK</span>
      </div>
      
      <div className="flex h-full">
        <NavItem id="audio" label="AUDIO_MATRIX" icon={Speaker} />
        <NavItem id="arena" label="COMBAT_SIM" icon={Crosshair} />
        <NavItem id="gallery" label="MODEL_INSPECTOR" icon={ScanEye} />
      </div>
    </div>
  );
};
