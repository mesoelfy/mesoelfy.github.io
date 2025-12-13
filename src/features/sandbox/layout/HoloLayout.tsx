import { ReactNode } from 'react';
import { HoloNav } from './HoloNav';
import { HoloHeader } from './HoloHeader';
import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { LogOut } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] bg-black text-service-cyan font-mono flex flex-col overflow-hidden">
        {/* Background Grid */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ 
                backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}
        />
        
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-50" />

        {/* Top UI */}
        <div className="relative z-50 flex-none flex flex-col">
            <HoloHeader />
            <div className="flex justify-between items-end bg-black/40 backdrop-blur-sm border-b border-service-cyan/20">
                <HoloNav />
                <button 
                    onClick={handleExit}
                    onMouseEnter={() => AudioSystem.playHover()}
                    className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-critical-red hover:bg-critical-red hover:text-black transition-colors border-l border-service-cyan/20"
                >
                    <LogOut size={14} /> EXIT_SIM
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 overflow-hidden p-6">
            <div className="w-full h-full border border-service-cyan/20 bg-black/20 backdrop-blur-sm relative overflow-hidden flex flex-col">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-service-cyan" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-service-cyan" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-service-cyan" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-service-cyan" />
                
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-service-cyan scrollbar-track-black p-6">
                    {children}
                </div>
            </div>
        </div>
    </div>
  );
};
