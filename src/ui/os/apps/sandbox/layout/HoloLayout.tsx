import { ReactNode } from 'react';
import { HoloNav } from './HoloNav';
import { HoloHeader } from './HoloHeader';
import { useStore } from '@/sys/state/global/useStore';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Power } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface HoloLayoutProps {
  children: ReactNode;
}

export const HoloLayout = ({ children }: HoloLayoutProps) => {
  const { resetApplication, sandboxView } = useStore();
  const is3D = sandboxView === 'arena' || sandboxView === 'gallery';

  const handleExit = () => {
      AudioSystem.playSound('ui_menu_close');
      resetApplication();
  };

  return (
    <div className={clsx(
        "fixed inset-0 z-[100] font-mono flex flex-col overflow-hidden transition-colors duration-500",
        is3D ? "bg-transparent pointer-events-none" : "bg-[#020408] pointer-events-auto"
    )}>
        
        {/* --- BACKGROUND SIMULATION LAYER (2D ONLY) --- */}
        {!is3D && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {/* 1. Deep Gradient Pulse */}
                <motion.div 
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0b1a26_0%,#000000_100%)] opacity-80"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* 2. Moving Floor Grid (Perspective) */}
                <div className="absolute inset-0 opacity-20"
                     style={{ 
                         perspective: '1000px',
                         transformStyle: 'preserve-3d'
                     }}>
                    <motion.div 
                        className="absolute inset-[-100%] w-[300%] h-[300%] origin-center"
                        style={{ 
                            backgroundImage: `
                                linear-gradient(to right, rgba(0, 240, 255, 0.1) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '80px 80px',
                            transform: 'rotateX(60deg) translateZ(-200px)'
                        }}
                        animate={{ y: [0, 80] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                {/* 3. Floating Particles */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                
                {/* 4. Vignette & Scanline */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,#000_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,240,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
            </div>
        )}

        {/* --- UI FRAME (Always on top, interactive) --- */}
        <div className="relative z-50 flex-none flex flex-col border-b border-service-cyan/30 bg-black/40 backdrop-blur-sm shadow-[0_4px_30px_rgba(0,240,255,0.1)] pointer-events-auto">
            <HoloHeader />
            <div className="flex justify-between items-end px-4 pb-0 bg-gradient-to-r from-service-cyan/5 to-transparent">
                <HoloNav />
                
                {/* EXIT BUTTON */}
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
        {/* In 3D mode, this is transparent layer over the canvas. 
            Children (Sidebars/Overlays) must enable pointer-events-auto themselves. */}
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
