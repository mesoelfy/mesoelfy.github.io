import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, AlertTriangle, ChevronRight, XCircle, CheckCircle2 } from 'lucide-react';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { clsx } from 'clsx';
import { DotGridBackground } from '@/ui/kit/atoms/DotGridBackground';

interface Props {
  isOpen: boolean;
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

export const MobileGateModal = ({ isOpen, onOverride }: Props) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg bg-[#050505] border border-primary-green/30 shadow-[0_0_100px_rgba(0,255,65,0.1)] overflow-hidden rounded-sm"
          >
            {/* --- DECORATIVE HEADER --- */}
            <div className="h-1 bg-gradient-to-r from-critical-red via-alert-yellow to-primary-green" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-alert-yellow animate-pulse" />
                    <span className="text-[10px] font-header font-black tracking-widest text-white/80">HARDWARE_CHECK // ANOMALY</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-critical-red/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-alert-yellow/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-green/50" />
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="relative p-6 md:p-8 flex flex-col gap-8">
                <DotGridBackground className="opacity-10" />
                
                {/* 1. THE COMPARISON MATRIX */}
                <div className="relative z-10 grid grid-cols-2 gap-4">
                    
                    {/* MOBILE (BAD) */}
                    <motion.div 
                        variants={itemVariants}
                        className="flex flex-col items-center gap-3 p-4 border border-critical-red/20 bg-critical-red/5 rounded-sm relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,60,0.05)_10px,rgba(255,0,60,0.05)_12px)] pointer-events-none" />
                        
                        <motion.div 
                            animate={{ x: [-2, 2, -2, 2, 0], rotate: [-2, 2, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}
                            className="relative"
                        >
                            <Smartphone size={48} className="text-critical-red opacity-80" />
                            <div className="absolute -top-2 -right-2 bg-black border border-critical-red rounded-full p-0.5">
                                <XCircle size={16} className="text-critical-red fill-black" />
                            </div>
                        </motion.div>
                        
                        <div className="text-center">
                            <h3 className="text-xs font-black font-header text-critical-red tracking-widest mb-1">MOBILE</h3>
                            <p className="text-[9px] font-mono text-critical-red/70">
                                LIMITED_VIEW<br/>
                                TOUCH_CONTROLS<br/>
                                <span className="font-bold">SUB-OPTIMAL</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* DESKTOP (GOOD) */}
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
                            <h3 className="text-xs font-black font-header text-primary-green tracking-widest mb-1">DESKTOP</h3>
                            <p className="text-[9px] font-mono text-primary-green/70">
                                FULL_IMMERSION<br/>
                                PRECISION_INPUT<br/>
                                <span className="font-bold">RECOMMENDED</span>
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* 2. WARNING TEXT */}
                <motion.div variants={itemVariants} className="relative z-10 text-center space-y-2">
                    <h2 className="text-xl font-header font-black text-white tracking-widest">
                        NARROW BANDWIDTH DETECTED
                    </h2>
                    <p className="text-xs font-mono text-gray-400 max-w-xs mx-auto leading-relaxed">
                        The Neural Lace requires a wide viewport for optimal synchronization. Proceeding on mobile may result in visual cramping and reduced immersion.
                    </p>
                </motion.div>

                {/* 3. OVERRIDE BUTTON */}
                <motion.div variants={itemVariants} className="relative z-10 pt-2">
                    <button
                        onClick={onOverride}
                        className="group w-full relative overflow-hidden py-4 bg-transparent border border-white/20 hover:border-alert-yellow/50 transition-colors"
                        onMouseEnter={() => AudioSystem.playHover()}
                    >
                        <div className="absolute inset-0 bg-alert-yellow/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        
                        <div className="relative flex items-center justify-center gap-3">
                            <span className="text-alert-yellow font-mono text-[10px] animate-pulse">⚠</span>
                            <span className="font-header font-black text-sm tracking-[0.2em] text-white group-hover:text-alert-yellow transition-colors">
                                ENTER ANYWAY?!
                            </span>
                            <ChevronRight size={16} className="text-white/50 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Glitch lines on button */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-alert-yellow/50 opacity-0 group-hover:opacity-100" />
                        <div className="absolute top-0 right-0 w-1 h-full bg-alert-yellow/50 opacity-0 group-hover:opacity-100" />
                    </button>
                    <div className="text-center mt-2">
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">
                            Override Authorization Code: ID_10_T
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
