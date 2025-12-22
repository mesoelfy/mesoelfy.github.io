import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Unlock, Lock, Skull } from 'lucide-react';
import { PALETTE } from '@/engine/config/Palette';

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

  // Animation Arrays mapped to Palette
  const animBorder = [
      `${PALETTE.GREEN.PRIMARY}4D`, // 30% alpha
      `${PALETTE.YELLOW.ALERT}99`, // 60% alpha
      `${PALETTE.RED.CRITICAL}99`, 
      `${PALETTE.YELLOW.ALERT}99`, 
      `${PALETTE.GREEN.PRIMARY}4D`
  ];
  
  const animBg = [
      `${PALETTE.GREEN.PRIMARY}1A`, // 10% alpha
      `${PALETTE.YELLOW.ALERT}26`, // 15% alpha
      `${PALETTE.RED.CRITICAL}26`, 
      `${PALETTE.YELLOW.ALERT}26`, 
      `${PALETTE.GREEN.PRIMARY}1A`
  ];

  const animText = [
      PALETTE.GREEN.PRIMARY,
      PALETTE.YELLOW.ALERT,
      PALETTE.RED.CRITICAL,
      PALETTE.YELLOW.ALERT,
      PALETTE.GREEN.PRIMARY
  ];

  return (
    <motion.div 
      className={`flex shrink-0 items-center justify-between border-b px-3 py-2 select-none transition-colors duration-500 ${!isCaution ? `${borderColor} ${bgColor}` : ''}`}
      animate={isCaution ? {
        borderColor: animBorder,
        backgroundColor: animBg,
      } : {}}
      transition={{ duration: 2.0, repeat: Infinity, ease: "linear", delay: isCaution ? 0.4 : 0 }}
    >
      <motion.span 
        className={`text-sm font-mono font-bold tracking-widest uppercase ${!isCaution ? textColor : ''}`}
        animate={isCaution ? { color: animText } : {}}
        transition={{ duration: 2.0, repeat: Infinity, ease: "linear", delay: isCaution ? 0.4 : 0 }}
      >
        MESOELFY_CORE
      </motion.span>
      
      <div className="relative w-6 h-6 flex items-center justify-center">
         <AnimatePresence mode="wait">
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

            {isDecrypted && (
                <motion.div 
                    key="unlocked"
                    initial={{ scale: 0.5, opacity: 0, rotate: -15 }} 
                    animate={{ 
                        scale: [1.5, 1], 
                        opacity: 1, 
                        rotate: 0,
                        filter: [`drop-shadow(0 0 0px ${PALETTE.GREEN.PRIMARY})`, `drop-shadow(0 0 10px ${PALETTE.GREEN.PRIMARY})`, `drop-shadow(0 0 0px ${PALETTE.GREEN.PRIMARY})`]
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

            {isCaution && (
                <motion.div 
                    key="caution"
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                >
                    <motion.div
                       animate={{
                           filter: [
                               `drop-shadow(0 0 8px ${PALETTE.GREEN.PRIMARY}CC)`, 
                               `drop-shadow(0 0 15px ${PALETTE.YELLOW.ALERT})`,
                               `drop-shadow(0 0 20px ${PALETTE.RED.CRITICAL})`, 
                               `drop-shadow(0 0 15px ${PALETTE.YELLOW.ALERT})`,
                               `drop-shadow(0 0 8px ${PALETTE.GREEN.PRIMARY}CC)`
                           ],
                           color: animText,
                           rotate: [0, 5, 0, -5, 0] 
                       }}
                       transition={{ duration: 2.0, repeat: Infinity, ease: "linear" }}
                    >
                         <Skull size={18} />
                    </motion.div>
                </motion.div>
            )}

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
