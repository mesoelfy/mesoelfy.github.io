import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, AlertTriangle, ChevronRight, XCircle, CheckCircle2, Maximize, ZoomIn, Scan } from 'lucide-react';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { DotGridBackground } from '@/ui/kit/atoms/DotGridBackground';
import { clsx } from 'clsx';

export type GateVariant = 'MOBILE' | 'ULTRAWIDE';

interface Props {
  isOpen: boolean;
  variant: GateVariant;
  onOverride: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  },
  exit: { 
    opacity: 0, 
    filter: "blur(10px)",
    transition: { duration: 0.5 } 
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

export const MobileGateModal = ({ isOpen, variant, onOverride }: Props) => {
  const isMobile = variant === 'MOBILE';
  const isUltrawide = variant === 'ULTRAWIDE';
  
  // Content Config
  const title = isMobile ? 'NARROW BANDWIDTH DETECTED' : 'SIGNAL DILUTED // WIDE FIELD';

  const leftLabel = isMobile ? "MOBILE" : "ULTRAWIDE";
  const leftSub = isMobile 
    ? <>LIMITED_VIEW<br/>TOUCH_CONTROLS</>
    : <>PIXEL_DENSITY<br/>TOO_SPARSE</>;

  const rightLabel = isMobile ? "DESKTOP" : "OPTIMIZED";
  const rightSub = isMobile
    ? <>FULL_IMMERSION<br/>PRECISION_INPUT</>
    : <>SCALE_UP<br/>BROWSER_ZOOM</>;

  const zoomText = isMobile ? "ZOOM: 100%" : "ZOOM: 125%+";

  // Scaling Classes
  const sizeConfig = isUltrawide ? {
    icon: 80,
    badgeIcon: 24,
    mainTitle: "text-4xl",
    matrixTitle: "text-lg",
    matrixText: "text-sm",
    buttonText: "text-xl",
    container: "max-w-4xl" 
  } : {
    icon: 48,
    badgeIcon: 12,
    mainTitle: "text-xl",
    matrixTitle: "text-xs",
    matrixText: "text-[9px]",
    buttonText: "text-sm",
    container: "max-w-2xl"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl cursor-none">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
                "relative w-full bg-[#050505] border border-primary-green/30 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm cursor-none",
                sizeConfig.container
            )}
          >
            {/* --- DECORATIVE HEADER --- */}
            <div className="h-1 bg-gradient-to-r from-critical-red via-alert-yellow to-primary-green" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="animate-pulse text-alert-yellow" />
                    <span className="text-[10px] font-header font-black tracking-widest text-white/80">
                        HARDWARE_CHECK // ANOMALY
                    </span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-critical-red/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-alert-yellow/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-green/50" />
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className={clsx("relative flex flex-col", isUltrawide ? "p-12 gap-12" : "p-6 md:p-8 gap-8")}>
                <DotGridBackground className="opacity-10" />
                
                {/* 1. THE COMPARISON MATRIX */}
                <div className="relative z-10 grid grid-cols-2 gap-4">
                    
                    {/* LEFT SIDE (PROBLEM - ALWAYS RED) */}
                    <motion.div 
                        variants={itemVariants}
                        className="flex flex-col items-center gap-3 p-4 border border-critical-red/20 bg-critical-red/5 rounded-sm relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,60,0.05)_10px,rgba(255,0,60,0.05)_12px)] pointer-events-none" />
                        
                        <motion.div 
                            animate={isMobile ? { x: [-2, 2, -2, 2, 0], rotate: [-2, 2, -2, 0] } : { scale: 0.8, opacity: 0.5 }}
                            transition={isMobile ? { repeat: Infinity, duration: 0.5, repeatDelay: 2 } : { duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            className="relative"
                        >
                            {isMobile ? <Smartphone size={sizeConfig.icon} className="text-critical-red opacity-80" /> : <Scan size={sizeConfig.icon} className="text-critical-red opacity-80" />}
                            <div className="absolute -top-2 -right-2 bg-black border border-critical-red rounded-full p-0.5">
                                <XCircle size={16} className="text-critical-red fill-black" />
                            </div>
                        </motion.div>
                        
                        <div className="text-center">
                            <h3 className={clsx("font-black font-header text-critical-red tracking-widest mb-1", sizeConfig.matrixTitle)}>{leftLabel}</h3>
                            <p className={clsx("font-mono text-critical-red/70", sizeConfig.matrixText)}>
                                {leftSub}<br/>
                                <span className="font-bold">SUB-OPTIMAL</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* RIGHT SIDE (SOLUTION - ALWAYS GREEN) */}
                    <motion.div 
                        variants={itemVariants}
                        className="flex flex-col items-center gap-3 p-4 border border-primary-green/20 bg-primary-green/5 rounded-sm relative overflow-hidden"
                    >
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1], filter: ["drop-shadow(0 0 0px #78F654)", "drop-shadow(0 0 15px #78F654)", "drop-shadow(0 0 0px #78F654)"] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="relative"
                        >
                            <Monitor size={sizeConfig.icon} className="text-primary-green" />
                            <div className="absolute -top-2 -right-2 bg-black border border-primary-green rounded-full p-0.5">
                                <CheckCircle2 size={16} className="text-primary-green fill-black" />
                            </div>
                        </motion.div>

                        <div className="text-center">
                            <h3 className={clsx("font-black font-header text-primary-green tracking-widest mb-1", sizeConfig.matrixTitle)}>{rightLabel}</h3>
                            <p className={clsx("font-mono text-primary-green/70", sizeConfig.matrixText)}>
                                {rightSub}<br/>
                                <span className="font-bold">RECOMMENDED</span>
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* 2. WARNING TEXT & INSTRUCTION ANIMATION */}
                <motion.div variants={itemVariants} className="relative z-10 text-center space-y-4">
                    <h2 className={clsx("font-header font-black text-white tracking-widest", sizeConfig.mainTitle)}>
                        {title}
                    </h2>
                    
                    {/* Animated Bracket Instructions */}
                    <div className="flex items-center justify-center gap-4 text-primary-green py-2">
                        <motion.span 
                            animate={{ x: [-5, -15, -5], opacity: [0.5, 1, 0.5] }} 
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-5xl font-light font-mono"
                        >
                            [
                        </motion.span>
                        
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            <div className={clsx("flex items-center justify-between gap-4 text-xs font-bold tracking-widest text-white border border-primary-green/30 bg-primary-green/10 px-3 py-1.5 rounded relative overflow-hidden group", sizeConfig.matrixText)}>
                                <div className="absolute inset-0 bg-primary-green/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 animate-pulse" />
                                <ZoomIn size={sizeConfig.badgeIcon} className="text-primary-green" />
                                <span className={isUltrawide ? "text-lg" : ""}>{zoomText}</span>
                            </div>
                            <div className={clsx("flex items-center justify-between gap-4 text-xs font-bold tracking-widest text-white border border-primary-green/30 bg-primary-green/10 px-3 py-1.5 rounded relative overflow-hidden", sizeConfig.matrixText)}>
                                <Maximize size={sizeConfig.badgeIcon} className="text-primary-green" />
                                <span className={isUltrawide ? "text-lg" : ""}>FULLSCREEN</span>
                            </div>
                        </div>

                        <motion.span 
                            animate={{ x: [5, 15, 5], opacity: [0.5, 1, 0.5] }} 
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-5xl font-light font-mono"
                        >
                            ]
                        </motion.span>
                    </div>
                </motion.div>

                {/* 3. OVERRIDE BUTTON */}
                <motion.div variants={itemVariants} className="relative z-10 pt-2">
                    <button
                        onClick={onOverride}
                        className={clsx(
                            "group w-full relative overflow-hidden py-4 bg-transparent border transition-colors cursor-none",
                            // REPLACED: service-cyan -> service-pink
                            isMobile ? "border-white/20 hover:border-alert-yellow/50" : "border-service-pink/30 hover:border-service-pink"
                        )}
                        onMouseEnter={() => AudioSystem.playHover()}
                    >
                        <div className={clsx("absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300", isMobile ? "bg-alert-yellow/10" : "bg-service-pink/10")} />
                        
                        <div className="relative flex items-center justify-center gap-3">
                            <span className="text-alert-yellow font-mono text-[10px] animate-pulse">⚠</span>
                            <span className={clsx("font-header font-black tracking-[0.2em] text-white group-hover:text-alert-yellow transition-colors", sizeConfig.buttonText)}>
                                ENTER ANYWAY?!
                            </span>
                            <ChevronRight size={16} className="text-white/50 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                    <div className="text-center mt-2">
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">
                            Override Authorization Code: {isMobile ? "ID_10_T" : "W1D3_L04D"}
                        </span>
                    </div>
                </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
