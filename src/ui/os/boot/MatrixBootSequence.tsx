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
import { Zap, ZapOff, Cpu, ChevronRight, Power, AlertTriangle } from 'lucide-react';
import { useStore } from '@/engine/state/global/useStore';

const GraphicsToggle = ({ mode, setMode }: { mode: 'HIGH' | 'POTATO', setMode: (m: 'HIGH' | 'POTATO') => void }) => {
  const isHigh = mode === 'HIGH';

  return (
    <div className="relative w-full h-16 bg-[#050505] border border-white/10 p-1 flex select-none">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '4px 4px' }} 
      />
      <motion.div
        layout
        initial={false}
        animate={{
          x: isHigh ? 0 : '100%',
          borderColor: isHigh ? '#78F654' : '#eae747',
          backgroundColor: isHigh ? 'rgba(120,246,84,0.05)' : 'rgba(234,231,71,0.05)'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] border shadow-[0_0_20px_rgba(0,0,0,0.5)] z-0"
      >
        <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }} 
            transition={{ duration: 2, repeat: Infinity }} 
            className={clsx("absolute inset-0 bg-gradient-to-r opacity-20", isHigh ? "from-primary-green/20 to-transparent" : "from-alert-yellow/20 to-transparent")} 
        />
        <div className={clsx("absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2", isHigh ? "border-primary-green" : "border-alert-yellow")} />
        <div className={clsx("absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2", isHigh ? "border-primary-green" : "border-alert-yellow")} />
      </motion.div>

      <button
        onClick={() => { setMode('HIGH'); AudioSystem.playClick(); }}
        onMouseEnter={() => AudioSystem.playHover()}
        className="flex-1 relative z-10 flex items-center justify-center gap-4 group"
      >
        <Zap 
            size={20} 
            className={clsx("transition-all duration-300", isHigh ? "text-primary-green fill-primary-green" : "text-gray-600 group-hover:text-gray-400")} 
        />
        <div className="flex flex-col items-start text-left">
            <span className={clsx("font-header font-black tracking-widest text-xs transition-colors duration-300", isHigh ? "text-white" : "text-gray-500 group-hover:text-gray-300")}>
                HIGH_VOLTAGE
            </span>
            <span className={clsx("font-mono text-[9px] tracking-wider transition-colors duration-300", isHigh ? "text-primary-green" : "text-gray-600")}>
                FULL_FIDELITY
            </span>
        </div>
      </button>

      <button
        onClick={() => { setMode('POTATO'); AudioSystem.playClick(); }}
        onMouseEnter={() => AudioSystem.playHover()}
        className="flex-1 relative z-10 flex items-center justify-center gap-4 group"
      >
        <ZapOff 
            size={20} 
            className={clsx("transition-all duration-300", !isHigh ? "text-alert-yellow fill-alert-yellow" : "text-gray-600 group-hover:text-gray-400")} 
        />
        <div className="flex flex-col items-start text-left">
            <span className={clsx("font-header font-black tracking-widest text-xs transition-colors duration-300", !isHigh ? "text-white" : "text-gray-500 group-hover:text-gray-300")}>
                POTATO_MODE
            </span>
            <span className={clsx("font-mono text-[9px] tracking-wider transition-colors duration-300", !isHigh ? "text-alert-yellow" : "text-gray-600")}>
                PERFORMANCE
            </span>
        </div>
      </button>
    </div>
  );
};

// --- INITIALIZE BUTTON ---
const InitializeButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <button 
            onClick={onClick}
            onMouseEnter={() => AudioSystem.playHover()}
            className="group relative w-full h-16 overflow-hidden bg-black border border-primary-green transition-all duration-300 hover:shadow-[0_0_30px_rgba(120,246,84,0.3)]"
        >
            <div className="absolute inset-0 bg-primary-green translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] transition-opacity duration-500" />
            <div className="absolute inset-0 flex items-center justify-between px-8 relative z-10">
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-3">
                        <Power size={18} className="text-primary-green group-hover:text-black transition-colors duration-300" />
                        <span className="font-header font-black text-xl tracking-[0.25em] text-white group-hover:text-black transition-colors duration-300">
                            INITIALIZE_SYSTEM
                        </span>
                    </div>
                    <span className="font-mono text-[9px] text-primary-green-dim group-hover:text-black/70 tracking-[0.4em] pl-8 transition-colors duration-300">
                        ESTABLISH_NEURAL_LINK
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                        <motion.div 
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        >
                            <ChevronRight size={20} className="text-primary-green group-hover:text-black transition-colors duration-300 -ml-2" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </button>
    );
};

// --- DANGER TRIANGLE ---
const DangerTriangle = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
            opacity: 1, 
            scale: 1,
            y: [-25, 25, -25], // UPDATED: Increased travel distance
            color: ['#FF003C', '#eae747', '#FF003C'] 
        }}
        transition={{ 
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            color: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { type: "spring", bounce: 0.5 },
            opacity: { duration: 0.5 }
        }}
        className="text-critical-red"
    >
        <AlertTriangle size={32} strokeWidth={2.5} />
    </motion.div>
);

export const MatrixBootSequence = ({ onComplete, onBreachStart }: { onComplete: () => void, onBreachStart: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { graphicsMode, setGraphicsMode } = useStore();
  const [uiScale, setUiScale] = useState(1.0);
  const { step, isBreaching, handleInitialize, logsToShow, showMatrix, showPayloadWindow, showButton } = useBootSequence({ onComplete, onBreachStart });
  
  useMatrixRain(canvasRef, showMatrix, isBreaching, step);

  useEffect(() => {
    const calc = () => Math.max(0.5, Math.min(window.innerWidth/680, window.innerHeight/850) * 0.96);
    setUiScale(calc());
    const res = () => { setUiScale(calc()); };
    window.addEventListener('resize', res); 
    return () => window.removeEventListener('resize', res);
  }, []);

  return (
    <motion.div animate={{ backgroundColor: isBreaching ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" }} className="fixed inset-0 z-boot font-mono outline-none bg-black cursor-none overflow-hidden">
      <canvas ref={canvasRef} className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 ${showMatrix && !isBreaching ? 'opacity-30' : 'opacity-0'}`} />
      
      <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
        <motion.div 
            className="flex flex-col gap-6 w-[680px] origin-center" 
            style={{ 
                transform: `scale(${isBreaching ? uiScale*1.1 : uiScale})`, 
                filter: isBreaching ? "blur(20px)" : "blur(0px)", 
                opacity: isBreaching ? 0 : 1, 
                transition: isBreaching ? "transform 0.8s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.5s ease-in, filter 0.5s ease-in" : "none"
            }}
        >
            <div className="w-full bg-black/90 border border-primary-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden shrink-0 relative z-20 flex flex-col">
                <BootHeader step={step} />
                <div className="relative w-full flex-1">
                    <DotGridBackground /> 
                    <div className="p-4 pt-2 h-44 flex flex-col justify-start text-sm font-mono relative z-10 leading-relaxed">
                        {logsToShow.map((line, i) => <TypedLog key={i} text={line.text} color={line.color} speed={line.speed} showDots={line.hasDots} blinkCycles={line.blinkCycles} isActive={i === step && !isBreaching} isPast={i < step} />)}
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
            {showPayloadWindow && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.3 }}
                    className="w-full bg-black/90 border border-primary-green shadow-[0_0_50px_rgba(0,255,65,0.1)] relative z-20 flex flex-col"
                >
                    <CoreHeader step={step} />
                    
                    <div className="relative w-full p-8 flex flex-col gap-8">
                        <DotGridBackground /> 
                        
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="flex items-center gap-6">
                                {step >= 6 && <DangerTriangle />}
                                <AsciiRenderer step={step} />
                                {step >= 6 && <DangerTriangle />}
                            </div>
                            <AnimatePresence>
                                {showButton && (
                                    <motion.div 
                                        key="controls" 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="w-full flex flex-col gap-6 pt-4 border-t border-white/10"
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest px-1">
                                                <Cpu size={12} /> 
                                                <span>Graphics_Kernel_Config</span>
                                            </div>
                                            <GraphicsToggle mode={graphicsMode} setMode={setGraphicsMode} />
                                        </div>
                                        <InitializeButton onClick={handleInitialize} />
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
