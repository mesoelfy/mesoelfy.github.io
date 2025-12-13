import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Cpu, Scan, Biohazard, Waves, Ban, Skull, AlertTriangle, Terminal } from 'lucide-react';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { DotGridBackground } from '@/ui/atoms/DotGridBackground';
import { clsx } from 'clsx';

interface Props {
  onComplete: () => void;
}

const STEPS = [
  { id: 'SCAN', duration: 2000, color: 'text-primary-green', border: 'border-primary-green' },
  { id: 'HARDWARE', duration: 2500, color: 'text-alert-yellow', border: 'border-alert-yellow' },
  { id: 'GPU', duration: 2500, color: 'text-critical-red', border: 'border-critical-red' },
  { id: 'ENV', duration: 3500, color: 'text-latent-purple', border: 'border-latent-purple' },
  { id: 'DENIED', duration: 3000, color: 'text-critical-red', border: 'border-critical-red' },
];

export const MobileRejectionModal = ({ onComplete }: Props) => {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = STEPS[stepIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const advance = () => {
      if (stepIndex < STEPS.length - 1) {
        setStepIndex(prev => prev + 1);
        
        // Audio Logic per step
        const nextId = STEPS[stepIndex + 1].id;
        if (nextId === 'DENIED') AudioSystem.playSound('ui_error');
        else if (nextId === 'ENV') AudioSystem.playSound('ui_chirp');
        else AudioSystem.playClick();
        
      } else {
        AudioSystem.playSound('fx_boot_sequence'); 
        onComplete();
      }
    };

    timer = setTimeout(advance, currentStep.duration);
    return () => clearTimeout(timer);
  }, [stepIndex, onComplete, currentStep]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-0">
      
      {/* Main Container Frame */}
      <motion.div 
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={clsx(
            "relative w-full max-w-sm bg-black/90 backdrop-blur-md border-y-2 overflow-hidden transition-colors duration-500 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]",
            currentStep.border
        )}
      >
        {/* Background Texture Layers */}
        <DotGridBackground color={currentStep.id === 'DENIED' ? '#FF003C' : '#15530A'} />
        
        {/* Animated Stripes Background */}
        <div className={clsx(
            "absolute inset-0 opacity-10 pointer-events-none transition-colors duration-500",
            stepIndex >= 2 ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,currentColor_10px,currentColor_12px)]" : ""
        )} style={{ color: stepIndex >= 4 ? '#FF003C' : '#9E4EA5' }} />

        {/* HEADER */}
        <div className={clsx("flex items-center justify-between px-4 py-2 border-b bg-black/50 transition-colors duration-500", currentStep.border)}>
            <div className="flex items-center gap-2">
                <Terminal size={14} className={currentStep.color} />
                <span className={clsx("text-[10px] font-header font-black tracking-widest uppercase", currentStep.color)}>
                    SYS_ANALYSIS_TOOL
                </span>
            </div>
            <div className="text-[9px] font-mono opacity-50">v.MOBILE.0.1</div>
        </div>

        {/* CONTENT AREA */}
        <div className="relative z-10 py-12 px-6 min-h-[320px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
            
            {/* STEP 1: SCANNING */}
            {currentStep.id === 'SCAN' && (
                <motion.div 
                key="scan"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                className="flex flex-col items-center gap-6 w-full"
                >
                <div className="relative w-24 h-24 border border-primary-green/30 bg-primary-green/5 flex items-center justify-center">
                    <Scan size={48} className="text-primary-green animate-pulse" />
                    <motion.div 
                        className="absolute inset-0 border-b-2 border-primary-green shadow-[0_0_15px_#78F654]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-green" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary-green" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary-green" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary-green" />
                </div>
                
                <div className="flex flex-col items-center gap-1">
                    <span className="text-primary-green font-bold tracking-widest animate-pulse text-sm">
                        SCANNING_FINGERPRINT...
                    </span>
                    <span className="text-[10px] text-primary-green-dim font-mono">
                        [ USER_AGENT_PARSING ]
                    </span>
                </div>
                </motion.div>
            )}

            {/* STEP 2: HARDWARE */}
            {currentStep.id === 'HARDWARE' && (
                <motion.div 
                key="hw"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex flex-col items-center gap-6 text-center w-full"
                >
                <div className="w-24 h-24 rounded-full border border-alert-yellow/30 bg-alert-yellow/5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 animate-spin-slow border-t border-alert-yellow opacity-50 rounded-full" />
                    <Smartphone size={40} className="text-alert-yellow drop-shadow-[0_0_10px_rgba(247,210,119,0.5)]" />
                </div>

                <div className="flex flex-col w-full border-l-2 border-alert-yellow pl-4 text-left bg-gradient-to-r from-alert-yellow/10 to-transparent py-2">
                    <span className="text-[9px] text-alert-yellow opacity-70 uppercase tracking-widest mb-1">HARDWARE_ID_FOUND</span>
                    <span className="text-xl text-alert-yellow font-black tracking-wider leading-none">
                    POCKET_DEVICE
                    </span>
                    <span className="text-[10px] text-white/60 font-mono mt-1">
                    CLASS: CONSUMER_GRADE
                    </span>
                </div>
                </motion.div>
            )}

            {/* STEP 3: GPU */}
            {currentStep.id === 'GPU' && (
                <motion.div 
                key="gpu"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="flex flex-col items-center gap-6 text-center w-full"
                >
                <div className="relative">
                    <Cpu size={64} className="text-critical-red animate-pulse" />
                    <AlertTriangle size={24} className="absolute -top-2 -right-2 text-critical-red bg-black rounded-full" />
                </div>

                <div className="flex flex-col items-center w-full px-4">
                    <span className="text-[10px] text-critical-red/70 uppercase tracking-widest mb-2">COMPUTE_POWER_ANALYSIS</span>
                    <span className="text-3xl text-critical-red font-black tracking-widest glitch-text drop-shadow-[0_0_10px_#FF003C]">
                    LAUGHABLE
                    </span>
                    
                    {/* Tech Bar */}
                    <div className="w-full bg-gray-900 h-3 mt-4 skew-x-[-12deg] overflow-hidden border border-critical-red/30 p-0.5">
                        <div className="h-full bg-critical-red w-[2%] shadow-[0_0_10px_#FF003C] animate-pulse" />
                    </div>
                    <span className="text-[9px] text-critical-red mt-1 font-mono w-full text-right">CAPACITY: 1.2%</span>
                </div>
                </motion.div>
            )}

            {/* STEP 4: THE TOILET BIT */}
            {currentStep.id === 'ENV' && (
                <motion.div 
                key="env"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-8 text-center w-full"
                >
                {/* Composite Icon Animation */}
                <div className="relative w-32 h-32 flex items-center justify-center bg-black/50 border border-latent-purple/30 rounded-full">
                    <motion.div 
                        animate={{ y: [0, -5, 0] }} 
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="z-10"
                    >
                        <Smartphone size={48} className="text-latent-purple" />
                    </motion.div>
                    
                    <motion.div 
                        className="absolute bottom-4 text-service-cyan opacity-50"
                        animate={{ scaleX: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Waves size={64} />
                    </motion.div>

                    <motion.div 
                        className="absolute top-0 right-0 text-alert-yellow bg-black rounded-full p-1 border border-alert-yellow"
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                    >
                        <Biohazard size={20} />
                    </motion.div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-latent-purple-light uppercase tracking-widest">GPS_TRIANGULATION_COMPLETE</span>
                    <span className="text-xs font-bold text-gray-400">ENVIRONMENT DETECTED:</span>
                    <div className="relative mt-1">
                        <div className="absolute inset-0 bg-latent-purple blur-lg opacity-20" />
                        <span className="relative z-10 text-2xl font-black text-latent-purple tracking-widest uppercase">
                        CERAMIC_THRONE
                        </span>
                    </div>
                </div>
                </motion.div>
            )}

            {/* STEP 5: DENIED */}
            {currentStep.id === 'DENIED' && (
                <motion.div 
                key="denied"
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, filter: "blur(20px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex flex-col items-center gap-6 text-center w-full"
                >
                <div className="relative p-6 border-2 border-critical-red bg-critical-red/5">
                    <Ban size={64} className="text-critical-red animate-pulse" />
                    <Skull size={32} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    
                    {/* Glitch Overlay */}
                    <div className="absolute inset-0 bg-critical-red/10 mix-blend-overlay animate-pulse" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 10%, 0 10%)' }} />
                </div>
                
                <div className="flex flex-col gap-3 w-full">
                    <h1 className="text-3xl font-black text-critical-red tracking-widest bg-black border-y border-critical-red py-2">
                    ACCESS DENIED
                    </h1>
                    <p className="text-xs text-gray-400 font-mono max-w-[240px] mx-auto leading-relaxed border-l-2 border-critical-red pl-3 text-left">
                    You cannot hack the mainframe from the bathroom.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10 w-full">
                        <div className="flex items-center justify-between text-[10px] font-mono text-primary-green">
                            <span className="animate-pulse">LOADING: DOOMSCROLL_PROTOCOL</span>
                            <span>[ 99% ]</span>
                        </div>
                        <div className="h-1 w-full bg-gray-800 mt-1">
                            <motion.div 
                                className="h-full bg-primary-green" 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.0, ease: "circOut" }}
                            />
                        </div>
                    </div>
                </div>
                </motion.div>
            )}

            </AnimatePresence>
        </div>

        {/* FOOTER */}
        <div className={clsx("px-4 py-2 border-t bg-black/80 flex justify-between items-center text-[9px] font-mono transition-colors duration-500", currentStep.border)}>
            <span className={currentStep.color}>{currentStep.id}_MODULE_ACTIVE</span>
            <span className="opacity-50">SECURE_CHANNEL: FALSE</span>
        </div>

        {/* Progress Bar (Global) */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-gray-900 w-full z-20">
            <motion.div 
                className={clsx("h-full transition-colors duration-500", currentStep.id === 'DENIED' ? "bg-critical-red" : "bg-primary-green")}
                initial={{ width: "0%" }}
                animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>
      </motion.div>
    </div>
  );
};
