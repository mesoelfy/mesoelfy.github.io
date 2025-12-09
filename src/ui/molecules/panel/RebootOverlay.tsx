import { motion } from 'framer-motion';
import { Power } from 'lucide-react';

export const RebootOverlay = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
    transition={{ duration: 0.4, ease: "backOut" }}
    className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-[2px]"
  >
    <div className="flex flex-col items-center gap-2 border-y-2 border-primary-green bg-primary-green/10 w-full py-4 relative overflow-hidden">
      <motion.div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary-green/20 to-transparent"
        animate={{ top: ["-100%", "100%"] }}
        transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        >
            <Power className="text-primary-green w-8 h-8 md:w-10 md:h-10" />
        </motion.div>
        <div className="flex flex-col">
            <motion.span 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-header font-black text-primary-green tracking-widest italic"
            >
                SYSTEM
            </motion.span>
            <motion.span 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs md:text-sm font-mono font-bold text-primary-green-dim tracking-[0.3em]"
            >
                RESTORED
            </motion.span>
        </div>
      </div>
    </div>
  </motion.div>
);
