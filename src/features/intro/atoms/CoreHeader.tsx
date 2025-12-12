import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Cpu, Unlock, Lock, Skull } from 'lucide-react';

interface CoreHeaderProps {
  step: number;
}

export const CoreHeader = ({ step }: CoreHeaderProps) => {
  const isUnsafe = step === 3;
  const isBypass = step === 4;
  const isDecrypted = step === 5;
  const isCaution = step >= 6;

  const [showCpu, setShowCpu] = useState(false);

  useEffect(() => {
    if (step === 5) {
      setShowCpu(false);
      const timer = setTimeout(() => {
        setShowCpu(true);
      }, 700); 
      return () => clearTimeout(timer);
    }
  }, [step]);

  let borderColor = "border-primary-green/30";
  let bgColor = "bg-primary-green/10";
  let textColor = "text-primary-green";

  if (isUnsafe) {
    borderColor = "border-critical-red/50";
    bgColor = "bg-critical-red/10";
    textColor = "text-critical-red";
  } else if (isBypass) {
    borderColor = "border-latent-purple/50";
    bgColor = "bg-latent-purple/10";
    textColor = "text-latent-purple-light";
  }

  return (
    <motion.div 
      className={`flex shrink-0 items-center justify-between border-b px-3 py-2 mb-2 select-none transition-colors duration-500 ${!isCaution ? `${borderColor} ${bgColor}` : ''}`}
      animate={isCaution ? {
        borderColor: ['rgba(120,246,84,0.3)', 'rgba(234,231,71,0.6)', 'rgba(120,246,84,0.3)'],
        backgroundColor: ['rgba(120,246,84,0.1)', 'rgba(234,231,71,0.15)', 'rgba(120,246,84,0.1)'],
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.span 
        className={`text-sm font-mono font-bold tracking-widest uppercase ${!isCaution ? textColor : ''}`}
        animate={isCaution ? {
            color: ['#78F654', '#eae747', '#78F654']
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        MESOELFY_CORE
      </motion.span>
      
      <div className="relative w-6 h-6 flex items-center justify-center">
         <AnimatePresence mode="wait">
            {isUnsafe ? (
                <motion.div 
                    key="unsafe"
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1, x: [-2, 2, -2, 2, 0] }}
                    exit={{ scale: 0 }}
                    transition={{ x: { repeat: Infinity, duration: 0.1 } }}
                >
                    <ShieldAlert size={18} className="text-critical-red" />
                </motion.div>
            ) : isBypass ? (
                <motion.div 
                    key="bypass"
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1.1 }} 
                    exit={{ opacity: 0, scale: 0, transition: { duration: 0.2, repeat: 0 } }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                >
                     <Unlock size={18} className="text-latent-purple-light" />
                </motion.div>
            ) : isCaution ? (
                <motion.div 
                    key="caution"
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <motion.div
                       animate={{
                           filter: ['drop-shadow(0 0 8px rgba(120,246,84,0.8))', 'drop-shadow(0 0 15px rgba(234,231,71,1))', 'drop-shadow(0 0 8px rgba(120,246,84,0.8))'],
                           color: ['#78F654', '#eae747', '#78F654'],
                           rotate: [0, 8, -8, 0] 
                       }}
                       transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
                    >
                         <Skull size={18} />
                    </motion.div>
                </motion.div>
            ) : isDecrypted ? (
                !showCpu ? (
                    <motion.div 
                        key="locked"
                        initial={{ scale: 1.5, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                         <Lock size={18} className="text-primary-green drop-shadow-[0_0_8px_rgba(120,246,84,0.8)]" />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="cpu"
                        initial={{ scale: 0, rotate: -45 }} 
                        animate={{ scale: 1, rotate: 0 }} 
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.4, ease: "backOut" }}
                    >
                         <Cpu size={18} className="text-primary-green drop-shadow-[0_0_8px_rgba(120,246,84,0.8)]" />
                    </motion.div>
                )
            ) : (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1, rotate: 360 }} 
                    exit={{ opacity: 0 }}
                    transition={{ rotate: { repeat: Infinity, duration: 2, ease: "linear" } }}
                >
                     <div className="w-4 h-4 border-2 border-primary-green border-t-transparent rounded-full" />
                </motion.div>
            )}
         </AnimatePresence>
      </div>
    </motion.div>
  );
};
