import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { GpuConfigPanel } from '@/ui/os/apps/settings/components/GpuConfigPanel';
import { clsx } from 'clsx';

// Atoms
import { BootHeader } from './atoms/BootHeader';
import { CoreHeader } from './atoms/CoreHeader';
import { AsciiRenderer } from './atoms/AsciiRenderer';
import { TypedLog } from './atoms/TypedLog';
import { DotGridBackground } from '@/ui/kit/atoms/DotGridBackground';

// Hooks
import { useBootSequence } from './hooks/useBootSequence';
import { useMatrixRain } from './hooks/useMatrixRain';
import { useSmartScroll } from './hooks/useSmartScroll';
import { useDeviceType } from '@/ui/sim/hooks/useDeviceType';
import { useStore } from '@/game/state/global/useStore';

interface Props {
  onComplete: () => void;
  onBreachStart: () => void;
}

export const MatrixBootSequence = ({ onComplete, onBreachStart }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainStackRef = useRef<HTMLDivElement>(null);
  
  const device = useDeviceType();
  const { setBootState, setIntroDone } = useStore();

  const { 
    step, isBreaching, showGpuPanel, handleInitialize: coreInitialize, logsToShow,
    showMatrix, showPayloadWindow, showWarningBox, showButton
  } = useBootSequence({ onComplete, onBreachStart });

  useMatrixRain(canvasRef, showMatrix, isBreaching, step);
  useSmartScroll(containerRef);

  useEffect(() => {
    if (showGpuPanel && mainStackRef.current) {
        mainStackRef.current.scrollIntoView({ inline: 'center', behavior: 'smooth' });
    }
  }, [showGpuPanel]);

  const handleWrapperClick = () => {
      if (device === 'mobile') {
          AudioSystem.init();
          AudioSystem.playSound('ui_error');
          setIntroDone(true);
          setBootState('mobile_lockdown');
      } else {
          coreInitialize();
      }
  };

  return (
    <motion.div 
      ref={containerRef}
      animate={{ backgroundColor: isBreaching ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={clsx(
          "fixed inset-0 z-[100] font-mono outline-none cursor-auto bg-black scrollbar-thin scrollbar-thumb-primary-green scrollbar-track-black",
          // UPDATED: Force hidden overflow when breaching starts to prevent scrollbar flash
          isBreaching ? "overflow-hidden" : "overflow-y-auto overflow-x-auto"
      )}
    >
      <canvas ref={canvasRef} className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 ${showMatrix && !isBreaching ? 'opacity-30' : 'opacity-0'}`} />

      <div className="min-h-full min-w-min w-full flex items-center p-2 md:p-8 relative z-10">
        
        <motion.div 
            className={clsx(
                "flex flex-col gap-4 transition-all duration-500 ease-out m-auto", 
                "w-full max-w-lg md:max-w-2xl lg:w-auto lg:max-w-none",
                showGpuPanel && !isBreaching 
                    ? "lg:grid lg:grid-cols-[18rem_42rem_18rem] lg:gap-8 lg:items-end" 
                    : ""
            )}
            animate={isBreaching ? { scale: 15, opacity: 0, filter: "blur(10px)" } : { opacity: 1, filter: "blur(0px)" }}
            initial={{ opacity: 0 }}
            transition={{ 
                scale: { duration: 0.8, ease: "easeIn" }, 
                opacity: { duration: 0.2, ease: "easeIn" }, 
                filter: { duration: 0.2 } 
            }}
        >
            
            {/* 1. GPU PANEL */}
            <AnimatePresence>
                {showGpuPanel && !isBreaching && (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        className="w-full lg:w-72 lg:col-start-1 lg:row-start-1 relative z-10 lg:justify-self-end order-2 lg:order-1"
                    >
                        <GpuConfigPanel />
                        <div className="mt-2 text-[10px] font-mono text-gray-500 text-center uppercase tracking-widest md:text-left absolute top-full w-full hidden md:block">
                            &gt;&gt; CAN BE CHANGED LATER.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. MAIN TERMINAL */}
            <div ref={mainStackRef} className="w-full lg:w-[42rem] lg:col-start-2 lg:row-start-1 flex flex-col gap-4 order-1 lg:order-2">
                
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-black/90 border border-primary-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden shrink-0 relative z-20 flex flex-col">
                    <BootHeader step={step} />
                    <div className="p-4 pt-2 h-40 flex flex-col justify-start text-xs md:text-sm font-mono relative z-10 leading-relaxed">
                        <DotGridBackground /> 
                        {logsToShow.map((line, i) => (
                            <TypedLog 
                                key={i} 
                                text={line.text} 
                                color={line.color} 
                                speed={line.speed} 
                                showDots={line.hasDots} 
                                isActive={i === step && !isBreaching} 
                                isPast={i < step} 
                            />
                        ))}
                    </div>
                </motion.div>

                <AnimatePresence>
                {showPayloadWindow && (
                    <motion.div 
                    initial={{ y: 50, opacity: 0, height: 0 }}
                    animate={{ y: 0, opacity: 1, height: "auto" }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className="w-full bg-black/90 border border-primary-green shadow-[0_0_40px_rgba(0,255,65,0.15)] overflow-hidden shrink-0 relative z-20"
                    >
                    <CoreHeader step={step} />
                    <div className="p-4 md:p-6 flex flex-col items-center gap-4 relative z-10">
                        <DotGridBackground />
                        <AsciiRenderer />
                        
                        {showWarningBox && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ 
                                opacity: 1, scale: 1,
                                boxShadow: ["0 0 10px rgba(255, 0, 60, 0.2)", "0 0 40px rgba(255, 0, 60, 0.6)", "0 0 10px rgba(255, 0, 60, 0.2)"]
                            }}
                            transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 }, boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
                            className="relative border border-critical-red bg-critical-red/10 w-auto mx-auto flex items-center justify-center gap-2 md:gap-4 py-2 px-3 md:px-6 select-none shrink-0 max-w-full"
                        >
                            <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-xl md:text-3xl text-critical-red">⚠</motion.span>
                            
                            <span className="text-[9px] md:text-sm font-header font-black tracking-widest text-center text-critical-red whitespace-nowrap pb-0.5">
                                UNSAFE CONNECTION DETECTED
                            </span>
                            
                            <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-xl md:text-3xl text-critical-red">⚠</motion.span>
                        </motion.div>
                        )}

                        {showButton && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="shrink-0 w-full md:w-auto">
                            <button 
                            onClick={handleWrapperClick}
                            onMouseEnter={() => AudioSystem.playHover()}
                            className="group relative w-full md:w-auto px-8 py-3 md:py-2 overflow-hidden border border-primary-green transition-all hover:shadow-[0_0_30px_rgba(0,255,65,0.6)] cursor-pointer"
                            >
                            <div className="absolute inset-0 bg-primary-green translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <span className="relative z-10 font-mono font-bold text-sm md:text-3xl text-primary-green group-hover:text-black transition-colors block tracking-widest whitespace-nowrap text-center">
                                [ INITIALIZE_SYSTEM ]
                            </span>
                            </button>
                        </motion.div>
                        )}
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {showGpuPanel && !isBreaching && (
                <div className="hidden lg:block w-72 lg:col-start-3 lg:row-start-1" />
            )}

        </motion.div>
      </div>
    </motion.div>
  );
};
