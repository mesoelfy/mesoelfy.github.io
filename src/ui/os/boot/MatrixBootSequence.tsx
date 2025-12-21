import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { clsx } from 'clsx';
import { BootHeader } from './atoms/BootHeader';
import { CoreHeader } from './atoms/CoreHeader';
import { AsciiRenderer } from './atoms/AsciiRenderer';
import { TypedLog } from './atoms/TypedLog';
import { DotGridBackground } from '@/ui/kit/atoms/DotGridBackground';
import { useBootSequence } from './hooks/useBootSequence';
import { useMatrixRain } from './hooks/useMatrixRain';
import { useSmartScroll } from './hooks/useSmartScroll';
import { Zap, ZapOff, Activity, Cpu, AlertTriangle } from 'lucide-react';
import { useStore } from '@/engine/state/global/useStore';

interface Props {
  onComplete: () => void;
  onBreachStart: () => void;
}

// --- SUB-COMPONENT: GPU SELECTION CARD ---
const GpuCard = ({ mode, active, onClick, icon: Icon, label, sub }: any) => {
  const isHigh = mode === 'HIGH';
  const color = isHigh ? 'text-primary-green' : 'text-alert-yellow';
  const borderColor = isHigh ? 'border-primary-green' : 'border-alert-yellow';
  const glow = isHigh ? 'shadow-[0_0_20px_rgba(120,246,84,0.2)]' : 'shadow-[0_0_20px_rgba(234,231,71,0.2)]';
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => AudioSystem.playHover()}
      className={clsx(
        "relative group flex items-center gap-4 p-4 border transition-all duration-300 overflow-hidden w-full text-left cursor-none",
        active 
          ? `${borderColor} bg-black ${glow}` 
          : "border-white/10 bg-white/5 hover:border-white/30"
      )}
    >
        {active && (
            <div className={clsx(
                "absolute inset-0 opacity-10 pointer-events-none",
                isHigh 
                  ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#78F654_10px,#78F654_12px)]" 
                  : "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#eae747_10px,#eae747_12px)]"
            )} />
        )}

        <div className="flex items-center gap-2 relative z-10 shrink-0">
            <motion.span 
                animate={active ? { x: -3, opacity: 1 } : { x: 0, opacity: 0.3 }}
                className={clsx("text-2xl font-light font-mono", active ? color : "text-gray-600")}
            >
                [
            </motion.span>
            
            <Icon size={24} className={clsx("transition-transform duration-300", active ? `${color} scale-110` : "text-gray-500 group-hover:text-white")} />
            
            <motion.span 
                animate={active ? { x: 3, opacity: 1 } : { x: 0, opacity: 0.3 }}
                className={clsx("text-2xl font-light font-mono", active ? color : "text-gray-600")}
            >
                ]
            </motion.span>
        </div>

        <div className="flex flex-col relative z-10 min-w-0">
            <span className={clsx("font-header font-black tracking-widest text-sm transition-colors", active ? "text-white" : "text-gray-400 group-hover:text-white")}>
                {label}
            </span>
            <span className={clsx("font-mono text-[9px] tracking-wider truncate", active ? color : "text-gray-600")}>
                {sub}
            </span>
        </div>

        {active && <div className={clsx("absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2", borderColor)} />}
    </button>
  );
};

export const MatrixBootSequence = ({ onComplete, onBreachStart }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { graphicsMode, setGraphicsMode } = useStore();
  const { 
    step, isBreaching, handleInitialize: coreInitialize, logsToShow,
    showMatrix, showPayloadWindow, showWarningBox, showButton
  } = useBootSequence({ onComplete, onBreachStart });

  useMatrixRain(canvasRef, showMatrix, isBreaching, step);

  // --- RESPONSIVE SCALING LOGIC ---
  const [uiScale, setUiScale] = useState(1.0);

  useEffect(() => {
    const handleResize = () => {
        // Base dimensions of the UI stack (approx 42rem width)
        const BASE_WIDTH = 680; 
        const BASE_HEIGHT = 850; 

        const widthScale = window.innerWidth / BASE_WIDTH;
        const heightScale = window.innerHeight / BASE_HEIGHT;

        // Fill screen up to 96%
        const fitScale = Math.min(widthScale, heightScale) * 0.96;
        
        setUiScale(Math.max(0.5, fitScale));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWrapperClick = () => {
      coreInitialize();
  };

  const handleGpuSelect = (mode: 'HIGH' | 'POTATO') => {
      if (graphicsMode !== mode) {
          setGraphicsMode(mode);
          AudioSystem.playClick();
      }
  };

  return (
    <motion.div 
      ref={containerRef}
      animate={{ backgroundColor: isBreaching ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={clsx(
          "fixed inset-0 z-boot font-mono outline-none bg-black cursor-none overflow-hidden"
      )}
    >
      <canvas ref={canvasRef} className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 ${showMatrix && !isBreaching ? 'opacity-30' : 'opacity-0'}`} />
      
      <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
        
        {/* --- MAIN STACK --- */}
        <motion.div 
            className="flex flex-col gap-4 w-[680px] origin-center"
            // Apply Dynamic Scale
            style={{ 
                transform: `scale(${isBreaching ? uiScale * 1.1 : uiScale})`,
                filter: isBreaching ? "blur(10px)" : "blur(0px)",
                opacity: isBreaching ? 0 : 1,
                transition: "transform 0.5s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.5s ease-in, filter 0.5s ease-in"
            }}
        >
            
            {/* PANEL 1: BOOT LOADER */}
            <div className="w-full bg-black/90 border border-primary-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden shrink-0 relative z-20 flex flex-col">
                <BootHeader step={step} />
                <div className="relative w-full flex-1">
                    <DotGridBackground /> 
                    {/* HEIGHT INCREASED: h-40 -> h-44 to fix cutoff */}
                    <div className="p-4 pt-2 h-44 flex flex-col justify-start text-sm font-mono relative z-10 leading-relaxed">
                        {logsToShow.map((line, i) => (
                            <TypedLog key={i} text={line.text} color={line.color} speed={line.speed} showDots={line.hasDots} isActive={i === step && !isBreaching} isPast={i < step} />
                        ))}
                    </div>
                </div>
            </div>

            {/* PANEL 2: UNIFIED CORE (Payload + GPU) */}
            <AnimatePresence mode="wait">
            {showPayloadWindow && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="w-full bg-black/90 border border-primary-green shadow-[0_0_40px_rgba(0,255,65,0.15)] overflow-hidden shrink-0 relative z-20 flex flex-col"
                >
                    <CoreHeader step={step} />
                    
                    {/* Content Container */}
                    <div className="relative w-full">
                        <DotGridBackground /> 
                        
                        {/* PADDING INCREASED: pt-3 -> pt-5 */}
                        <div className="px-4 pb-4 pt-5 flex flex-col items-center gap-6 relative z-10">
                            
                            {/* 1. ASCII ART */}
                            <AsciiRenderer isInfected={showWarningBox} />

                            {/* 2. WARNING BOX (Conditional) */}
                            <AnimatePresence mode="wait">
                                {showWarningBox && !showButton && (
                                    <motion.div 
                                        key="warning-box"
                                        initial={{ opacity: 0, scale: 0.9, height: 0 }}
                                        animate={{ 
                                            opacity: 1, 
                                            scale: 1,
                                            height: "auto",
                                            boxShadow: [
                                                "0 0 10px rgba(255,0,60,0.3)", 
                                                "0 0 50px rgba(255,0,60,0.8)", 
                                                "0 0 10px rgba(255,0,60,0.3)"
                                            ]
                                        }}
                                        exit={{ 
                                            opacity: 0, 
                                            scale: 0.9, 
                                            height: 0,
                                            transition: { duration: 0.3 } 
                                        }}
                                        transition={{ 
                                            opacity: { duration: 0.3 }, 
                                            scale: { duration: 0.3 },
                                            boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                        className="border border-critical-red bg-critical-red/20 px-6 py-3 flex items-center gap-4 relative overflow-hidden shrink-0"
                                    >
                                        <motion.div 
                                            className="absolute inset-0"
                                            style={{ 
                                                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 0, 60, 0.1) 10px, rgba(255, 0, 60, 0.1) 20px)" 
                                            }}
                                            animate={{ backgroundPosition: ["0px 0px", "-28px 0px"] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                        
                                        <motion.div 
                                            animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }} 
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        >
                                            <AlertTriangle size={24} className="text-critical-red drop-shadow-[0_0_10px_#FF003C]" />
                                        </motion.div>
                                        
                                        <span className="text-xs font-bold font-header tracking-[0.2em] text-critical-red drop-shadow-sm relative z-10 whitespace-nowrap">
                                            UNSAFE CONNECTION
                                        </span>
                                        
                                        <motion.div 
                                            animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }} 
                                            transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                                        >
                                            <AlertTriangle size={24} className="text-critical-red drop-shadow-[0_0_10px_#FF003C]" />
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 3. CONFIG & INITIALIZE (Final Step) */}
                            <AnimatePresence>
                                {showButton && (
                                    <motion.div 
                                        key="config-grid"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full flex flex-col gap-6 pt-2 border-t border-white/10"
                                    >
                                        
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest px-1">
                                                <span className="flex items-center gap-2"><Cpu size={12} /> Graphics_Kernel</span>
                                                <span>Select Profile</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <GpuCard 
                                                    mode="HIGH" 
                                                    label="HIGH_VOLTAGE" 
                                                    sub="MAX_FIDELITY // BLOOM" 
                                                    icon={Zap} 
                                                    active={graphicsMode === 'HIGH'} 
                                                    onClick={() => handleGpuSelect('HIGH')} 
                                                />
                                                <GpuCard 
                                                    mode="POTATO" 
                                                    label="POTATO_MODE" 
                                                    sub="PERFORMANCE // RETRO" 
                                                    icon={ZapOff} 
                                                    active={graphicsMode === 'POTATO'} 
                                                    onClick={() => handleGpuSelect('POTATO')} 
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleWrapperClick} 
                                            onMouseEnter={() => AudioSystem.playHover()} 
                                            className="group relative w-full py-5 overflow-hidden border border-primary-green bg-black hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] transition-all cursor-none"
                                        >
                                            <div className="absolute inset-0 bg-primary-green translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out opacity-20" />
                                            <div className="relative z-10 flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-3">
                                                    <Activity size={20} className="text-primary-green animate-pulse" />
                                                    <span className="font-header font-black text-2xl tracking-[0.2em] text-white group-hover:text-primary-green transition-colors">
                                                        INITIALIZE_SYSTEM
                                                    </span>
                                                    <Activity size={20} className="text-primary-green animate-pulse" />
                                                </div>
                                                <span className="text-xs font-mono text-primary-green-dim tracking-[0.3em] group-hover:text-primary-green transition-colors">
                                                    CLICK TO INJECT PAYLOAD
                                                </span>
                                            </div>
                                        </button>

                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

        </motion.div>
      </div>
    </motion.div>
  );
};
