import { motion } from 'framer-motion';
import { ChevronUp, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

// --- CONSTANTS ---
const TEXT = "SYSTEM BREACH // CRITICAL FAILURE // REBOOT REQUIRED // ";
// Repeat enough times to ensure the strip covers the diagonal width of even large panels
const REPEAT_COUNT = 8; 
const FULL_TEXT = Array(REPEAT_COUNT).fill(TEXT).join("");

// --- SUB-COMPONENT: HAZARD STRIP ---
const HazardStrip = ({ direction, outlined }: { direction: 1 | -1, outlined: boolean }) => {
  return (
    <div className="flex relative overflow-visible w-full select-none opacity-50">
      <motion.div
        className={clsx(
          "flex whitespace-nowrap font-header font-black text-4xl md:text-6xl tracking-widest uppercase",
          outlined ? "text-transparent" : "text-critical-red"
        )}
        style={{ 
            // Manual webkit stroke since Tailwind doesn't have a utility for it by default
            WebkitTextStroke: outlined ? '1px #FF003C' : '0px',
        }}
        animate={{ 
            x: direction === 1 ? ["-25%", "0%"] : ["0%", "-25%"] 
        }}
        transition={{ 
            duration: 10, 
            ease: "linear", 
            repeat: Infinity 
        }}
      >
        {/* We render the text huge to cover the translation distance seamlessly */}
        <span className="shrink-0 px-4">{FULL_TEXT}</span>
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
  const safeProgress = (Number.isFinite(progress) && !isNaN(progress)) 
    ? Math.max(0, Math.min(100, progress)) 
    : 0;

  return (
    <div className={clsx(
        "absolute inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden",
        isVideo ? "bg-black/40 backdrop-blur-[2px]" : "bg-black/80 backdrop-blur-md"
    )}>
        
        {/* 1. THE INFINITE HAZARD TAPE LAYER (Background) */}
        {/* Oversized container (-100% inset) rotated -12deg to cover corners */}
        <div className="absolute inset-[-100%] flex flex-col justify-center gap-0 md:gap-4 rotate-[-12deg] pointer-events-none mix-blend-overlay">
            {Array.from({ length: 16 }).map((_, i) => (
                <HazardStrip 
                    key={i} 
                    direction={i % 2 === 0 ? 1 : -1} 
                    outlined={i % 2 !== 0} 
                />
            ))}
        </div>

        {/* 2. VIGNETTE & SCANLINE OVERLAY */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_20%,#000_100%)] z-10" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10" />

        {/* 3. INTERACTIVE LAYER (Foreground) */}
        {showInteractive && (
          <div className="relative z-20 flex flex-col items-center justify-center gap-4 cursor-crosshair group">
              
              {/* Animated Reboot Icon */}
              <div className="relative">
                  {/* IDLE STATE: Red Alert */}
                  <div className="group-hover:opacity-0 transition-opacity duration-300 absolute inset-0 flex items-center justify-center">
                      <motion.div 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="text-critical-red drop-shadow-[0_0_10px_#FF003C]"
                      >
                          <AlertTriangle size={64} strokeWidth={1.5} />
                      </motion.div>
                  </div>

                  {/* HOVER STATE: Purple Uplink */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute inset-0 flex items-center justify-center -translate-y-8">
                      <motion.div 
                          animate={{ scale: [1, 1.1, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }}
                          transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-latent-purple drop-shadow-[0_0_20px_#9E4EA5]"
                      >
                          <ChevronUp size={80} strokeWidth={3} />
                      </motion.div>
                  </div>
                  
                  {/* Spacer */}
                  <div className="w-20 h-20" />
              </div>

              {/* Status Text & Progress Bar */}
              <div className="flex flex-col items-center text-center gap-2">
                  <div className="bg-critical-red/10 border border-critical-red/50 px-4 py-1 backdrop-blur-md">
                      <span className="text-xs font-header font-black tracking-[0.2em] text-critical-red group-hover:text-latent-purple transition-colors duration-200 drop-shadow-sm">
                          HOLD TO REBOOT
                      </span>
                  </div>
                  
                  <div className="w-48 bg-gray-900/80 h-2 rounded-full overflow-hidden border border-gray-700 shadow-lg relative">
                      <motion.div 
                          className="h-full bg-gradient-to-r from-critical-red via-latent-purple to-service-cyan" 
                          initial={{ width: "0%" }}
                          animate={{ width: `${safeProgress}%` }}
                          transition={{ type: "tween", duration: 0.1 }}
                      />
                      {/* Scanline on bar */}
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] w-full h-full opacity-30" />
                  </div>
                  
                  <div className="flex justify-between w-full text-[9px] font-mono font-bold">
                      <span className="text-critical-red">INTEGRITY: {Math.floor(safeProgress)}%</span>
                      <span className={clsx("transition-opacity", safeProgress > 0 ? "opacity-100 text-service-cyan" : "opacity-0")}>
                          RECOVERING...
                      </span>
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};
