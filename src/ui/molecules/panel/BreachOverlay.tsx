import { motion } from 'framer-motion';
import { ChevronUp, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

// --- CONSTANTS ---
const TEXT = "SYSTEM BREACH // CRITICAL FAILURE // REBOOT REQUIRED // ";
const REPEAT_COUNT = 8; 
const FULL_TEXT = Array(REPEAT_COUNT).fill(TEXT).join("");

// --- SUB-COMPONENT: HAZARD STRIP ---
const HazardStrip = ({ direction, isSecondary, isActive }: { direction: 1 | -1, isSecondary: boolean, isActive: boolean }) => {
  return (
    <div className={clsx(
        "flex relative overflow-visible w-full select-none transition-opacity duration-500",
        // Lowered overall opacity, with secondary rows much fainter
        isSecondary ? "opacity-10" : "opacity-30" 
    )}>
      <motion.div
        className={clsx(
          "flex whitespace-nowrap font-header font-black text-4xl md:text-6xl tracking-widest uppercase transition-colors duration-300 ease-out",
          // Color: Deeper Purple instead of bright lavender
          // Speed: 300ms transition for snappy feedback
          isActive ? "text-latent-purple" : "text-critical-red"
        )}
        animate={{ 
            x: direction === 1 ? ["-25%", "0%"] : ["0%", "-25%"] 
        }}
        transition={{ 
            // Secondary (Left) rows move slower (80s) than Primary (Right) rows (50s)
            duration: isSecondary ? 80 : 50, 
            ease: "linear", 
            repeat: Infinity 
        }}
      >
        <span className="shrink-0 px-4">{FULL_TEXT}</span>
      </motion.div>
    </div>
  );
};

interface BreachOverlayProps {
  progress: number;
  isVideo: boolean;
  showInteractive: boolean;
  isRepairing?: boolean; 
}

export const BreachOverlay = ({ progress, isVideo, showInteractive, isRepairing = false }: BreachOverlayProps) => {
  const safeProgress = (Number.isFinite(progress) && !isNaN(progress)) 
    ? Math.max(0, Math.min(100, progress)) 
    : 0;

  // Active if repairing OR hovering (UI Feedback)
  const isActive = isRepairing;

  return (
    <div className={clsx(
        "absolute inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden",
        isVideo ? "bg-black/60 backdrop-blur-[2px]" : "bg-black/80 backdrop-blur-md"
    )}>
        
        {/* 1. BACKGROUND LAYERS */}
        <div className="absolute inset-[-100%] flex flex-col justify-center gap-0 md:gap-4 rotate-[-12deg] pointer-events-none">
            {Array.from({ length: 16 }).map((_, i) => (
                <HazardStrip 
                    key={i} 
                    direction={i % 2 === 0 ? 1 : -1} 
                    isSecondary={i % 2 !== 0} 
                    isActive={isActive}
                />
            ))}
        </div>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_20%,#000_100%)] z-10" />

        {/* 2. INTERACTIVE LAYER */}
        {showInteractive && (
          <div className="relative z-20 flex flex-col items-center justify-center gap-4 cursor-crosshair group">
              
              {/* Animated Icon Container */}
              <div className="relative h-24 flex items-center justify-center">
                  
                  {/* IDLE: Red Alert Triangle */}
                  <div className={clsx("absolute inset-0 flex items-center justify-center transition-opacity duration-300", isActive ? "opacity-0" : "group-hover:opacity-0")}>
                      <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="text-critical-red drop-shadow-[0_0_15px_#FF003C]"
                      >
                          <AlertTriangle size={64} strokeWidth={1.5} />
                      </motion.div>
                  </div>

                  {/* ACTIVE/HOVER: Purple Uplink Chevron */}
                  <div className={clsx("absolute inset-0 flex items-center justify-center -translate-y-8 transition-opacity duration-200", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                      <motion.div 
                          animate={{ 
                              scale: [1, 1.2, 1], 
                              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] 
                          }}
                          transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-latent-purple drop-shadow-[0_0_25px_#E0B0FF]"
                      >
                          <ChevronUp size={80} strokeWidth={4} />
                      </motion.div>
                  </div>
              </div>

              {/* Status & Bar */}
              <div className="flex flex-col items-center text-center gap-2">
                  <div className={clsx(
                      "px-4 py-1 backdrop-blur-md border transition-colors duration-300",
                      isActive 
                          ? "bg-latent-purple/10 border-latent-purple/50" 
                          : "bg-critical-red/10 border-critical-red/50"
                  )}>
                      <span className={clsx(
                          "text-xs font-header font-black tracking-[0.2em] transition-colors duration-200 drop-shadow-sm",
                          isActive ? "text-[#E0B0FF]" : "text-critical-red group-hover:text-latent-purple"
                      )}>
                          {isActive ? "REBOOTING..." : "HOLD TO REBOOT"}
                      </span>
                  </div>
                  
                  <div className="w-48 bg-gray-900/80 h-2 rounded-full overflow-hidden border border-gray-700 shadow-lg relative">
                      {/* Gradient: Heavily weighted towards purple. Red only at the very start (0-10%) */}
                      <motion.div 
                          className="h-full bg-gradient-to-r from-critical-red from-5% via-latent-purple via-30% to-[#E0B0FF]" 
                          initial={{ width: "0%" }}
                          animate={{ width: `${safeProgress}%` }}
                          transition={{ type: "tween", duration: 0.1 }}
                      />
                  </div>
                  
                  <div className="flex justify-between w-full text-[9px] font-mono font-bold">
                      {/* INTEGRITY Text: Switches color when Active */}
                      <span className={clsx(
                          "transition-colors duration-200", 
                          isActive ? "text-[#E0B0FF]" : "text-critical-red"
                      )}>
                          INTEGRITY: {Math.floor(safeProgress)}%
                      </span>
                      
                      <span className={clsx("transition-opacity", safeProgress > 0 ? "opacity-100 text-[#E0B0FF]" : "opacity-0")}>
                          RECOVERING...
                      </span>
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};
