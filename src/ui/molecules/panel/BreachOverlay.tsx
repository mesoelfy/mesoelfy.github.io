import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

const ScrollingRow = ({ direction, text }: { direction: number, text: string }) => {
  return (
    <div className="flex whitespace-nowrap overflow-hidden select-none opacity-60">
      <motion.div 
        className="flex gap-4 font-header font-black text-xl md:text-2xl text-elfy-red tracking-widest uppercase py-1"
        animate={{ x: direction === 1 ? ["-50%", "0%"] : ["0%", "-50%"] }} 
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={i % 2 === 0 ? "text-elfy-red" : "text-transparent stroke-elfy-red stroke-1"}>
             {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

interface BreachOverlayProps {
  progress: number;
  isVideo: boolean;
  showInteractive: boolean;
}

export const BreachOverlay = ({ progress, isVideo, showInteractive }: BreachOverlayProps) => {
  return (
    <div className={clsx(
        "absolute inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden",
        isVideo ? "bg-black/20 backdrop-blur-[2px]" : "bg-black/60 backdrop-blur-sm"
    )}>
        <div className="absolute inset-[-50%] flex flex-col justify-center rotate-[-12deg] opacity-30 pointer-events-none">
            <motion.div
               className="flex flex-col gap-8"
               animate={{ y: ["0%", "-50%"] }}
               transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
                {[0, 1].map((set) => (
                    <div key={set} className="flex flex-col gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ScrollingRow 
                                key={`${set}-${i}`} 
                                direction={i % 2 === 0 ? 1 : -1} 
                                text="SYSTEM BREACH // CRITICAL FAILURE // REBOOT REQUIRED //" 
                            />
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>

        {showInteractive && (
          <div className="relative z-20 flex flex-col items-center justify-center gap-2 cursor-crosshair transition-all duration-100">
              <div className="relative">
                  <div className="group-hover:opacity-0 transition-opacity duration-200 absolute inset-0 flex items-center justify-center">
                      <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="text-elfy-red drop-shadow-md"
                      >
                          <ChevronUp size={64} strokeWidth={3} />
                      </motion.div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute inset-0 flex items-center justify-center -translate-y-8">
                      <motion.div 
                          animate={{ scale: [1, 1.2, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }}
                          transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-elfy-purple drop-shadow-[0_0_15px_#9E4EA5]"
                      >
                          <ChevronUp size={64} strokeWidth={4} />
                      </motion.div>
                  </div>
                  
                  <div className="w-16 h-16 pointer-events-none opacity-0"><ChevronUp size={64} /></div>
              </div>

              <div className="flex flex-col items-center text-center">
                  <span className="text-sm font-header font-black tracking-widest text-elfy-red group-hover:text-elfy-purple transition-colors duration-200 drop-shadow-md">
                      HOLD TO REBOOT
                  </span>
                  
                  <div className="w-32 bg-gray-900/80 h-1.5 mt-2 rounded-full overflow-hidden border border-gray-700 shadow-lg">
                      <motion.div 
                          className="h-full bg-elfy-purple shadow-[0_0_10px_#9E4EA5]" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "tween", duration: 0.1 }}
                      />
                  </div>
                  
                  <div className="text-[10px] font-mono text-elfy-purple font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 rounded">
                      INTEGRITY: {Math.floor(progress)}%
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};
