import { motion } from 'framer-motion';
import { Smartphone, RotateCcw } from 'lucide-react';
import { useStore } from '@/sys/state/global/useStore';

export const RotationLock = () => {
  const { bootState } = useStore();

  // Don't render anything if we are still in the intro sequence
  if (bootState === 'standby') return null;

  // VISUAL ONLY:
  // The actual pausing logic is now handled centrally in page.tsx 
  // to prevent conflicts with menus/modals.
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex-col items-center justify-center gap-8 hidden portrait:flex md:portrait:hidden pointer-events-auto">
      
      {/* ANIMATION CONTAINER */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* The Phone */}
        <motion.div
          animate={{ rotate: -90 }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5, 
            ease: "easeInOut", 
            repeatDelay: 1 
          }}
          className="relative z-10"
        >
          <Smartphone size={64} className="text-primary-green drop-shadow-[0_0_15px_rgba(120,246,84,0.5)]" strokeWidth={1.5} />
        </motion.div>

        {/* The Arrow Hint */}
        <motion.div
          animate={{ opacity: [0, 1, 0], rotate: -90 }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5, 
            ease: "easeInOut", 
            repeatDelay: 1 
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
           <RotateCcw size={100} className="text-primary-green-dim/30" />
        </motion.div>
      </div>

      {/* TEXT */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-header font-black text-primary-green tracking-widest uppercase">
          Orientation<br/>Lock
        </h2>
        <p className="text-xs font-mono text-primary-green-dim max-w-[200px] mx-auto leading-relaxed">
          // SYSTEM_REQ:<br/>
          PLEASE ROTATE DEVICE TO<br/>
          LANDSCAPE MODE
        </p>
      </div>

      {/* DECORATIVE LINES */}
      <div className="absolute bottom-8 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-green/50 to-transparent opacity-50" />
      <div className="absolute top-8 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-green/50 to-transparent opacity-50" />

    </div>
  );
};
