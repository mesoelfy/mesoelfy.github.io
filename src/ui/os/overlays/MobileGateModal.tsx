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
  
  // Content Config
  const title = isMobile ? 'NARROW BANDWIDTH DETECTED' : 'SIGNAL DILUTED // WIDE FIELD';
  const desc = isMobile 
    ? 'The Neural Lace requires a wide viewport for optimal synchronization. Proceeding on mobile may result in visual cramping.'
    : 'Viewport density is too low for current resolution. Visual artifacts may appear tiny in the void.';

  const leftLabel = isMobile ? "MOBILE" : "ULTRAWIDE";
  const leftSub = isMobile 
    ? <>LIMITED_VIEW<br/>TOUCH_CONTROLS</>
    : <>PIXEL_DENSITY<br/>TOO_SPARSE</>;

  const rightLabel = isMobile ? "DESKTOP" : "OPTIMIZED";
  const rightSub = isMobile
    ? <>FULL_IMMERSION<br/>PRECISION_INPUT</>
    : <>SCALE_UP<br/>BROWSER_ZOOM</>;

  const zoomText = isMobile ? "ZOOM: 100%" : "ZOOM: 125%+";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
                "relative w-full max-w-2xl bg-[#050505] border shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm",
                isMobile ? "border-primary-green/30" : "border-service-cyan/30 shadow-[0_0_50px_rgba(0,240,255,0.1)]"
            )}
          >
            {/* --- DECORATIVE HEADER --- */}
            <div className={clsx("h-1 bg-gradient-to-r", isMobile ? "from-critical-red via-alert-yellow to-primary-green" : "from-service-cyan via-white to-service-cyan")} />
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={clsx("animate-pulse", isMobile ? "text-alert-yellow" : "text-service-cyan")} />
                    <span className="text-[10px] font-header font-black tracking-widest text-white/80">
                        HARDWARE_CHECK // {isMobile ? 'ANOMALY' : 'DENSITY_LOW'}
                    </span>
                </div>
                <div className="flex gap-1">
                    <div className={clsx("w-1.5 h-1.5 rounded-full", isMobile ? "bg-critical-red/50" : "bg-service-cyan/50")} />
                    <div className={clsx("w-1.5 h-1.5 rounded-full", isMobile ? "bg-alert-yellow/50" : "bg-white/50")} />
                    <div className={clsx("w-1.5 h-1.5 rounded-full", isMobile ? "bg-primary-green/50" : "bg-service-cyan/50")} />
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="relative p-6 md:p-8 flex flex-col gap-8">
                <DotGridBackground className="opacity-10" />
                
                {/* 1. THE COMPARISON MATRIX */}
                <div className="relative z-10 grid grid-cols-2 gap-4">
                    
                    {/* LEFT SIDE (PROBLEM - ALWAYS RED) */}
                    <motion.div 
                        variants={itemVariants}
                        className={clsx("flex flex-col items-center gap-3 p-4 border border-critical-red/20 bg-critical-red/5 rounded-sm relative group overflow-hidden")}
                    >
                        <div className={clsx("absolute inset-0 pointer-events-none opacity-5", isMobile ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#FF003C_10px,#FF003C_12px)]" : "bg-service-cyan")} />
                        
                        <motion.div 
                            animate={isMobile ? { x: [-2, 2, -2, 2, 0], rotate: [-2, 2, -2, 0] } : { scale: 0.8, opacity: 0.5 }}
                            transition={isMobile ? { repeat: Infinity, duration: 0.5, repeatDelay: 2 } : { duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            className="relative"
                        >
                            {isMobile ? <Smartphone size={48} className="text-critical-red opacity-80" /> : <Scan size={48} className="text-critical-red opacity-80" />}
                            <div className="absolute -top-2 -right-2 bg-black border border-critical-red rounded-full p-0.5">
                                <XCircle size={16} className="text-critical-red fill-black" />
                            </div>
                        </motion.div>
                        
                        <div className="text-center">
                            <h3 className="text-xs font-black font-header text-critical-red tracking-widest mb-1">{leftLabel}</h3>
                            <p className="text-[9px] font-mono text-critical-red/70">
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
                            <Monitor size={48} className="text-primary-green" />
                            <div className="absolute -top-2 -right-2 bg-black border border-primary-green rounded-full p-0.5">
                                <CheckCircle2 size={16} className="text-primary-green fill-black" />
                            </div>
                        </motion.div>

                        <div className="text-center">
                            <h3 className="text-xs font-black font-header text-primary-green tracking-widest mb-1">{rightLabel}</h3>
                            <p className="text-[9px] font-mono text-primary-green/70">
                                {rightSub}<br/>
                                <span className="font-bold">RECOMMENDED</span>
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* 2. WARNING TEXT & INSTRUCTION ANIMATION */}
                <motion.div variants={itemVariants} className="relative z-10 text-center space-y-4">
                    <h2 className="text-xl font-header font-black text-white tracking-widest">
                        {title}
                    </h2>
                    
                    <p className="text-xs font-mono text-gray-400 max-w-xs mx-auto leading-relaxed">
                        {desc}
                    </p>

                    {/* Animated Bracket Instructions */}
                    <div className={clsx("flex items-center justify-center gap-4 text-primary-green py-2")}>
                        <motion.span 
                            animate={{ x: [-5, -15, -5], opacity: [0.5, 1, 0.5] }} 
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-5xl font-light font-mono"
                        >
                            [
                        </motion.span>
                        
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            <div className={clsx("flex items-center justify-between gap-2 text-xs font-bold tracking-widest text-white border px-3 py-1.5 rounded relative overflow-hidden group", isMobile ? "border-primary-green/30 bg-primary-green/10" : "border-service-cyan/30 bg-service-cyan/10")}>
                                <div className={clsx("absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 animate-pulse", isMobile ? "bg-primary-green/20" : "bg-service-cyan/20")} />
                                <ZoomIn size={12} className={isMobile ? "text-primary-green" : "text-service-cyan"} />
                                <span>{zoomText}</span>
                            </div>
                            <div className={clsx("flex items-center justify-between gap-2 text-xs font-bold tracking-widest text-white border px-3 py-1.5 rounded relative overflow-hidden", isMobile ? "border-primary-green/30 bg-primary-green/10" : "border-service-cyan/30 bg-service-cyan/10")}>
                                <Maximize size={12} className={isMobile ? "text-primary-green" : "text-service-cyan"} />
                                <span>FULLSCREEN</span>
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
                            "group w-full relative overflow-hidden py-4 bg-transparent border transition-colors",
                            isMobile ? "border-white/20 hover:border-alert-yellow/50" : "border-service-cyan/30 hover:border-service-cyan"
                        )}
                        onMouseEnter={() => AudioSystem.playHover()}
                    >
                        <div className={clsx("absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300", isMobile ? "bg-alert-yellow/10" : "bg-service-cyan/10")} />
                        
                        <div className="relative flex items-center justify-center gap-3">
                            <span className={clsx("font-mono text-[10px] animate-pulse", isMobile ? "text-alert-yellow" : "text-service-cyan")}>⚠</span>
                            <span className={clsx("font-header font-black text-sm tracking-[0.2em] transition-colors", isMobile ? "text-white group-hover:text-alert-yellow" : "text-white group-hover:text-service-cyan")}>
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
