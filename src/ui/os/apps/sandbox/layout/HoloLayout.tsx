import { ReactNode } from 'react';
import { HoloNav } from './HoloNav';
import { HoloHeader } from './HoloHeader';
import { useStore } from '@/engine/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Power } from 'lucide-react';
import { clsx } from 'clsx';

interface HoloLayoutProps {
  children: ReactNode;
}

export const HoloLayout = ({ children }: HoloLayoutProps) => {
  const { resetApplication } = useStore();

  const handleExit = () => {
      AudioSystem.playSound('ui_menu_close');
      resetApplication();
  };

  return (
    <div className="fixed inset-0 z-[100] font-mono flex flex-col overflow-hidden bg-transparent pointer-events-none">
        
        {/* --- UI FRAME (Interactive) --- */}
        <div className="relative z-50 flex-none flex flex-col border-b border-service-cyan/30 bg-black/40 backdrop-blur-sm shadow-[0_4px_30px_rgba(0,240,255,0.1)] pointer-events-auto">
            <HoloHeader />
            <div className="flex justify-between items-end px-4 pb-0 bg-gradient-to-r from-service-cyan/5 to-transparent">
                <HoloNav />
                <button 
                    onClick={handleExit}
                    onMouseEnter={() => AudioSystem.playHover()}
                    className="group relative flex items-center gap-3 px-6 py-3 text-[10px] font-bold tracking-widest text-critical-red hover:text-black transition-all overflow-hidden border-t border-x border-critical-red/20 hover:border-critical-red rounded-t-sm mb-[-1px]"
                >
                    <div className="absolute inset-0 bg-critical-red translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
                    <Power size={14} className="relative z-10" />
                    <span className="relative z-10">TERMINATE_SIM</span>
                </button>
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="relative z-10 flex-1 overflow-hidden p-6 md:p-10 flex flex-col">
            <div className="flex-1 w-full h-full relative">
                {children}
            </div>
        </div>
        
        {/* --- DECORATIVE HUD ELEMENTS --- */}
        <div className="absolute bottom-4 left-4 text-[9px] text-service-cyan/40 font-mono pointer-events-none">
            COORD: {Math.random().toFixed(4)} // {Math.random().toFixed(4)}
        </div>
        <div className="absolute bottom-4 right-4 text-[9px] text-service-cyan/40 font-mono pointer-events-none flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-service-cyan/50 animate-pulse" />
            LIVE_FEED
        </div>
    </div>
  );
};
