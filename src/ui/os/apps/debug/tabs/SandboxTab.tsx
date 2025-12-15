import { Box, ArrowRight, Zap } from 'lucide-react';
import { useStore } from '@/sys/state/global/useStore';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { motion } from 'framer-motion';

interface SandboxTabProps {
  closeDebug: () => void;
}

export const SandboxTab = ({ closeDebug }: SandboxTabProps) => {
  const { setIntroDone, setBootState, setSimulationPaused } = useStore();
  const { startGame } = useGameStore();

  const enterSandbox = () => {
      AudioSystem.init();
      AudioSystem.startMusic();
      setIntroDone(true);
      setBootState('sandbox');
      setSimulationPaused(false);
      try {
          const reg = ServiceLocator.getRegistry();
          if (reg) reg.clear();
      } catch {}
      startGame();
      closeDebug();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
        
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md border border-service-cyan/30 bg-[#001014] p-1 relative group overflow-hidden"
        >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-service-cyan" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-service-cyan" />

            <div className="bg-black/50 p-8 flex flex-col items-center text-center relative z-10 backdrop-blur-sm">
                
                <div className="w-20 h-20 bg-service-cyan/10 rounded-full flex items-center justify-center mb-6 border border-service-cyan/30 shadow-[0_0_30px_rgba(0,240,255,0.15)] group-hover:scale-110 transition-transform duration-500">
                    <Box size={40} className="text-service-cyan" />
                </div>

                <h2 className="text-2xl font-header font-black text-service-cyan tracking-widest mb-2">
                    HOLO_DECK
                </h2>
                
                <p className="text-xs text-service-cyan/60 font-mono mb-8 leading-relaxed max-w-[240px]">
                    Initialize high-fidelity simulation environment. 
                    <br/><span className="text-gray-500">Warning: Main OS will be suspended.</span>
                </p>

                <button 
                    onClick={enterSandbox}
                    onMouseEnter={() => AudioSystem.playHover()}
                    className="w-full py-4 bg-service-cyan text-black font-header font-black text-sm tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        INITIALIZE <ArrowRight size={16} />
                    </span>
                    <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-300 z-0" />
                </button>
            </div>

            {/* Animated Grid BG */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(0,240,255,0.1)_25%,rgba(0,240,255,0.1)_50%,transparent_50%,transparent_75%,rgba(0,240,255,0.1)_75%,rgba(0,240,255,0.1)_100%)] bg-[length:20px_20px] animate-pulse" />
        </motion.div>

        <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-gray-500">
            <Zap size={12} className="text-alert-yellow" />
            <span>GPU_ACCELERATION: ENABLED</span>
        </div>
    </div>
  );
};
