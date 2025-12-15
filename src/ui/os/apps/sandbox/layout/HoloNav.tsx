import { useStore } from '@/sys/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Speaker, Crosshair, ScanEye } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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
          "relative flex items-center gap-3 px-6 py-3 transition-all duration-300 group overflow-hidden border-t border-x rounded-t-md mx-1 mb-[-1px]",
          isActive 
            ? "border-service-cyan/50 text-black z-10" 
            : "border-transparent text-service-cyan/60 hover:text-service-cyan hover:bg-service-cyan/5"
        )}
      >
        {/* Background Slide */}
        {isActive && (
            <motion.div 
                layoutId="holo-nav-bg"
                className="absolute inset-0 bg-service-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                initial={false}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
        )}
        
        {/* Scanline Effect on Hover (Inactive) */}
        {!isActive && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-service-cyan/10 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500" />
        )}

        <Icon size={16} className="relative z-10" strokeWidth={isActive ? 2.5 : 1.5} />
        <span className="font-header font-bold text-xs tracking-widest relative z-10">
            {label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex h-full items-end pt-2">
      <NavItem id="audio" label="AUDIO_MATRIX" icon={Speaker} />
      <NavItem id="arena" label="COMBAT_SIM" icon={Crosshair} />
      <NavItem id="gallery" label="MODEL_INSPECTOR" icon={ScanEye} />
    </div>
  );
};
