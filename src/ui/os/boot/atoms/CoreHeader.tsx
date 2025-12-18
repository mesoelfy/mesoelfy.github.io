import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Unlock, Lock, Skull } from 'lucide-react';

interface CoreHeaderProps {
  step: number;
}

export const CoreHeader = ({ step }: CoreHeaderProps) => {
  const isUnsafe = step === 3;
  const isBypass = step === 4;
  const isDecrypted = step === 5;
  const isCaution = step >= 6;

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

  // FIXED: Removed 'mb-2' to allow body content to sit flush against the header border
  return (
    <motion.div 
      className={`flex shrink-0 items-center justify-between border-b px-3 py-2 select-none transition-colors duration-500 ${!isCaution ? `${borderColor} ${bgColor}` : ''}`}
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
            {/* STEP 3: UNSAFE */}
            {isUnsafe && (
                <motion.div 
                    key="unsafe"
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1, x: [-2, 2, -2, 2, 0] }}
                    exit={{ scale: 0 }}
                    transition={{ x: { repeat: Infinity, duration: 0.1 } }}
                >
                    <ShieldAlert size={18} className="text-critical-red" />
                </motion.div>
            )}

            {/* STEP 4: BYPASSING */}
            {isBypass && (
                <motion.div 
                    key="bypass"
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ 
                        scale: [1, 1.1, 1], 
                        opacity: 1,
                        x: [-1, 1, -1, 1, 0], 
                        filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                    }} 
                    exit={{ scale: 0, transition: { duration: 0.1 } }}
                    transition={{ 
                        scale: { repeat: Infinity, duration: 0.5 },
                        x: { repeat: Infinity, duration: 0.1 } 
                    }}
                >
                     <Lock size={18} className="text-latent-purple-light" />
                </motion.div>
            )}

            {/* STEP 5: DECRYPTED */}
            {isDecrypted && (
                <motion.div 
                    key="unlocked"
                    initial={{ scale: 0.5, opacity: 0, rotate: -15 }} 
                    animate={{ 
                        scale: [1.5, 1], 
                        opacity: 1, 
                        rotate: 0,
                        filter: ["drop-shadow(0 0 0px #78F654)", "drop-shadow(0 0 10px #78F654)", "drop-shadow(0 0 0px #78F654)"]
                    }} 
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                        default: { type: "spring", bounce: 0.5, duration: 0.4 },
                        filter: { type: "tween", duration: 0.4, ease: "easeInOut" }
                    }}
                >
                     <Unlock size={18} className="text-primary-green" strokeWidth={3} />
                </motion.div>
            )}

            {/* STEP 6: CAUTION */}
            {isCaution && (
                <motion.div 
                    key="caution"
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
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
            )}

            {/* LOADING SPINNER */}
            {!isUnsafe && !isBypass && !isDecrypted && !isCaution && (
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
