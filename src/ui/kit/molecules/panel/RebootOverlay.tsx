import { motion } from 'framer-motion';
import { Power } from 'lucide-react';
import { PALETTE } from '@/engine/config/Palette';

export const RebootOverlay = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    // Outer fade slightly delayed to let inner animations finish
    exit={{ opacity: 0, transition: { delay: 0.1, duration: 0.2 } }}
    className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-[2px]"
  >
    <motion.div 
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        exit={{ 
            scaleY: 0, 
            opacity: 0,
            transition: { delay: 0.1, duration: 0.2, ease: "easeIn" } 
        }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        className="flex flex-col items-center gap-2 border-y-2 border-service-pink bg-service-pink/10 w-full py-4 relative overflow-hidden origin-center"
    >
      <motion.div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-service-pink/20 to-transparent"
        animate={{ top: ["-100%", "100%"] }}
        transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
      />

      <div className="relative z-10 flex items-center gap-3">
        {/* Icon: Exits IMMEDIATELY with backIn easing */}
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          exit={{ 
              rotate: -180, 
              scale: 0,
              transition: { duration: 0.2, ease: "backIn" } 
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
            <Power className="text-service-pink w-8 h-8 md:w-10 md:h-10" />
        </motion.div>

        <div className="flex flex-col overflow-hidden">
            {/* Text: Fades instantly on exit trigger */}
            <motion.span 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }} 
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-header font-black text-service-pink tracking-widest italic"
                style={{ filter: `drop-shadow(0 0 10px ${PALETTE.PINK.PRIMARY}80)` }}
            >
                SYSTEM
            </motion.span>
            <motion.span 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ delay: 0.2 }}
                className="text-xs md:text-sm font-mono font-bold text-service-pink/80 tracking-[0.3em]"
            >
                RESTORED
            </motion.span>
        </div>
      </div>
    </motion.div>
  </motion.div>
);
