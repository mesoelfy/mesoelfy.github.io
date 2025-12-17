import { motion } from 'framer-motion';
import { ChevronUp, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

const TEXT = "SYSTEM BREACH // CRITICAL FAILURE // REBOOT REQUIRED // ";
const REPEAT_COUNT = 8; 
const FULL_TEXT = Array(REPEAT_COUNT).fill(TEXT).join("");

const HazardStrip = ({ direction, isSecondary, isActive, index }: { direction: 1 | -1, isSecondary: boolean, isActive: boolean, index: number }) => {
  const staggerOffset = ((index * 23) % 80) - 40; 

  return (
    <div 
        className={clsx(
            "flex relative overflow-visible w-full select-none transition-opacity duration-500",
            isSecondary ? "opacity-10" : "opacity-30" 
        )}
        style={{ transform: `translateX(${staggerOffset}%)` }}
    >
      <motion.div
        className={clsx(
          "flex whitespace-nowrap font-header font-black text-4xl md:text-6xl tracking-widest uppercase transition-colors duration-300 ease-out",
          isActive ? "text-latent-purple" : "text-critical-red"
        )}
        animate={{ x: direction === 1 ? ["-25%", "0%"] : ["0%", "-25%"] }}
        transition={{ duration: isSecondary ? 80 : 50, ease: "linear", repeat: Infinity }}
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
  panelId?: string;
}

export const BreachOverlay = ({ progress, isVideo, showInteractive, isRepairing = false, panelId }: BreachOverlayProps) => {
  const safeProgress = (Number.isFinite(progress) && !isNaN(progress)) ? Math.max(0, Math.min(100, progress)) : 0;
  const isActive = isRepairing;
  const isCompactHeight = panelId === 'feed' || panelId === 'social';
  const showStatusBar = panelId !== 'social';

  return (
    <div className={clsx(
        "absolute inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden",
        isVideo ? "bg-black/60 backdrop-blur-[2px]" : "bg-black/80 backdrop-blur-md"
    )}>
        <div className="absolute inset-[-100%] flex flex-col justify-center gap-0 md:gap-4 rotate-[-12deg] pointer-events-none">
            {Array.from({ length: 16 }).map((_, i) => (
                <HazardStrip key={i} index={i} direction={i % 2 === 0 ? 1 : -1} isSecondary={i % 2 !== 0} isActive={isActive} />
            ))}
        </div>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_20%,#000_100%)] z-10" />

        {showInteractive && (
          <div className={clsx("relative z-20 flex flex-col items-center justify-center gap-1 cursor-crosshair group", isCompactHeight ? "mb-0" : "mb-[25%]")}>
              <div className="relative h-20 flex items-center justify-center">
                  <div className={clsx("absolute inset-0 flex items-center justify-center transition-opacity duration-300", isActive ? "opacity-0" : "group-hover:opacity-0")}>
                      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-critical-red drop-shadow-[0_0_15px_#FF003C]">
                          <AlertTriangle size={64} strokeWidth={1.5} />
                      </motion.div>
                  </div>
                  <div className={clsx("absolute inset-0 flex items-center justify-center -translate-y-8 transition-opacity duration-200", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                      <motion.div 
                          animate={{ scale: [1, 1.2, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }}
                          transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-latent-purple drop-shadow-[0_0_25px_#E0B0FF]"
                      >
                          <ChevronUp size={80} strokeWidth={4} />
                      </motion.div>
                  </div>
              </div>

              {showStatusBar && (
                  <div className="flex flex-col items-center text-center gap-2">
                      <div className={clsx("px-4 py-1 backdrop-blur-md border transition-colors duration-300", isActive ? "bg-latent-purple/10 border-latent-purple/50" : "bg-critical-red/10 border-critical-red/50")}>
                          <span className={clsx("text-xs font-header font-black tracking-[0.2em] transition-colors duration-200 drop-shadow-sm", isActive ? "text-[#E0B0FF]" : "text-critical-red group-hover:text-latent-purple")}>
                              {isActive ? "REBOOTING..." : "HOLD TO REBOOT"}
                          </span>
                      </div>
                      <div className="w-48 bg-gray-900/80 h-2 rounded-full overflow-hidden border border-gray-700 shadow-lg relative">
                          <motion.div 
                              className="h-full bg-gradient-to-r from-[#2a0a2e] via-latent-purple to-[#E0B0FF]" 
                              initial={{ width: "0%" }}
                              animate={{ width: `${safeProgress}%` }}
                              transition={{ type: "tween", duration: 0.1 }}
                          />
                      </div>
                      <div className="flex justify-between w-full text-[9px] font-mono font-bold">
                          <span className={clsx("transition-colors duration-200", isActive ? "text-[#E0B0FF]" : "text-critical-red")}>INTEGRITY: {Math.floor(safeProgress)}%</span>
                          <span className={clsx("transition-all duration-300", isActive ? "opacity-100 text-[#E0B0FF]" : "opacity-0 text-[#2a0a2e]")}>ACTIVE...</span>
                      </div>
                  </div>
              )}
          </div>
        )}
    </div>
  );
};
