import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect as useReactEffect, useState as useReactState, useRef as useReactRef } from 'react';
import { usePanelRegistry } from '@/game/hooks/usePanelRegistry';
import { useGameStore } from '@/game/store/useGameStore';
import { ChevronUp, Skull, Power, Check, AlertTriangle, RefreshCw, Zap, Plus } from 'lucide-react';

// --- CONSTANTS ---
const MAX_HEALTH = 1000;

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  shattered: (custom: number) => ({
    y: 350 + (custom * 50),
    opacity: 0.8,
    rotate: custom * 15,
    transition: { 
        duration: 1.5, 
        ease: "anticipate",
        delay: Math.abs(custom) * 0.1 
    }
  })
};

// --- SUB-COMPONENTS ---

const RebootOverlay = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
    transition={{ duration: 0.4, ease: "backOut" }}
    className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-[2px]"
  >
    <div className="flex flex-col items-center gap-2 border-y-2 border-elfy-green bg-elfy-green/10 w-full py-4 relative overflow-hidden">
      <motion.div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-elfy-green/20 to-transparent"
        animate={{ top: ["-100%", "100%"] }}
        transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        >
            <Power className="text-elfy-green w-8 h-8 md:w-10 md:h-10" />
        </motion.div>
        <div className="flex flex-col">
            <motion.span 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-header font-black text-elfy-green tracking-widest italic"
            >
                SYSTEM
            </motion.span>
            <motion.span 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs md:text-sm font-mono font-bold text-elfy-green-dim tracking-[0.3em]"
            >
                RESTORED
            </motion.span>
        </div>
      </div>
    </div>
  </motion.div>
);

const IntelligentHeader = ({ title, health, isDestroyed, isGameOver, gameId }: { title: string, health: number, isDestroyed: boolean, isGameOver: boolean, gameId?: string }) => {
  const interactionTarget = useGameStore(state => state.interactionTarget);
  const isInteracting = gameId && interactionTarget === gameId;
  
  const healthPercent = (health / MAX_HEALTH) * 100;
  const isDamaged = !isDestroyed && healthPercent < 100;

  // --- OPTIMAL ICON STATE LOGIC ---
  const [showOptimal, setShowOptimal] = useReactState(false);

  useReactEffect(() => {
    // 1. If damaged, arm the "Optimal" state so it shows when healed
    if (health < MAX_HEALTH) {
      setShowOptimal(true);
    }
    
    // 2. If healed (100%) AND showing optimal, start timer to hide it
    if (health >= MAX_HEALTH && showOptimal) {
      const timer = setTimeout(() => setShowOptimal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [health, showOptimal]);

  // Determine Colors & Status
  let mainColor = "text-elfy-green";
  let statusText = "SECURE";
  
  if (isGameOver) {
      mainColor = "text-elfy-red";
      statusText = "SYSTEM_FAILURE";
  } else if (isDestroyed) {
      mainColor = isInteracting ? "text-elfy-purple" : "text-elfy-red";
      statusText = isInteracting ? "REBOOTING..." : "OFFLINE";
  } else if (isInteracting && isDamaged) {
      mainColor = "text-elfy-cyan";
      statusText = "HEALING...";
  } else if (isDamaged) {
      mainColor = "text-elfy-yellow"; 
      statusText = "ATTENTION_REQ";
  } else if (!showOptimal) {
      // Hidden state (initial or settled)
      mainColor = "text-elfy-green-dim";
      statusText = "ONLINE";
  }

  return (
    <div className={clsx(
        "relative flex flex-col border-b transition-colors duration-300 shrink-0 z-10",
        isGameOver ? "bg-elfy-red/10 border-elfy-red/50" :
        isDestroyed ? (isInteracting ? "bg-elfy-purple/10 border-elfy-purple/50" : "bg-elfy-red/10 border-elfy-red/50") :
        (isInteracting && isDamaged) ? "bg-elfy-cyan/10 border-elfy-cyan/50" :
        isDamaged ? "bg-elfy-yellow/10 border-elfy-yellow/30" : 
        "bg-elfy-green/5 border-elfy-green-dim/30"
    )}>
        <div className="flex items-center justify-between px-3 py-1.5 h-8">
            
            {/* LEFT: Title & Status Text */}
            <div className="flex items-baseline gap-2">
                <span className={clsx(
                    "text-sm md:text-base font-header font-bold uppercase tracking-wider drop-shadow-md transition-colors duration-300",
                    mainColor
                )}>
                    {title}
                </span>
                <span className={clsx(
                    "text-[8px] font-mono tracking-widest opacity-80",
                    mainColor
                )}>
                    [{statusText}]
                </span>
            </div>

            {/* RIGHT: The "Action Node" */}
            <div className="w-5 h-5 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    
                    {isGameOver ? (
                        <motion.div 
                            key="gameover"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="text-elfy-red drop-shadow-[0_0_8px_currentColor]"
                        >
                            <Skull size={16} />
                        </motion.div>

                    ) : isDestroyed ? (
                        isInteracting ? (
                            <motion.div 
                                key="rebooting"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 bg-elfy-purple rounded-full flex items-center justify-center shadow-[0_0_10px_currentColor]"
                            >
                                <motion.div animate={{ rotate: 360, opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                    <Zap size={10} className="text-black fill-current" />
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="destroyed"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 border border-elfy-purple rounded-full flex items-center justify-center opacity-80"
                            >
                                <Power size={10} className="text-elfy-purple" />
                            </motion.div>
                        )

                    ) : isInteracting && isDamaged ? (
                        <motion.div 
                            key="healing"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 bg-elfy-cyan rounded-full flex items-center justify-center shadow-[0_0_10px_currentColor]"
                        >
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <RefreshCw size={10} className="text-black" />
                            </motion.div>
                        </motion.div>

                    ) : isDamaged ? (
                        <motion.div 
                            key="damaged"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-elfy-yellow drop-shadow-[0_0_5px_currentColor]"
                        >
                            <AlertTriangle size={16} />
                        </motion.div>

                    ) : showOptimal ? (
                        // ONLY SHOW IF RECENTLY HEALED
                        <motion.div 
                            key="optimal"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="w-4 h-4 bg-elfy-green rounded-full flex items-center justify-center shadow-[0_0_5px_currentColor]"
                        >
                            <Check size={10} className="text-black stroke-[3px]" />
                        </motion.div>
                    ) : null}

                </AnimatePresence>
            </div>
        </div>

        {/* Health Bar */}
        {!isGameOver && (
            <div className="w-full h-1 bg-black/50 relative overflow-hidden">
                <motion.div 
                    className={clsx(
                        "h-full transition-colors duration-200",
                        isDestroyed ? "bg-transparent" : 
                        (isInteracting && isDamaged) ? "bg-elfy-cyan" :
                        isDamaged ? "bg-elfy-yellow" : 
                        "bg-elfy-green"
                    )}
                    initial={{ width: "100%" }}
                    animate={{ width: `${healthPercent}%` }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
                />
            </div>
        )}
    </div>
  );
};

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

const BreachOverlay = ({ progress, isVideo, showInteractive }: { progress: number, isVideo: boolean, showInteractive: boolean }) => {
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

export const GlassPanel = ({ children, className, title, gameId }: GlassPanelProps) => {
  const registryRef = gameId ? usePanelRegistry(gameId) : null;
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  
  const interactionTarget = useGameStore(state => state.interactionTarget);
  const isInteracting = gameId && interactionTarget === gameId;

  const isGameOver = Math.floor(systemIntegrity) <= 0;
  const panelState = useGameStore((state) => gameId ? state.panels[gameId] : null);

  const health = panelState ? panelState.health : MAX_HEALTH;
  const isDestroyed = panelState ? panelState.isDestroyed : false;
  const healthPercent = (health / MAX_HEALTH) * 100; 
  const isDamaged = health < MAX_HEALTH;

  const [showReboot, setShowReboot] = useReactState(false);
  const prevDestroyed = useReactRef(isDestroyed);

  useReactEffect(() => {
    if (prevDestroyed.current && !isDestroyed && !isGameOver) {
        setShowReboot(true);
        const timer = setTimeout(() => setShowReboot(false), 2000); 
        return () => clearTimeout(timer);
    }
    prevDestroyed.current = isDestroyed;
  }, [isDestroyed, isGameOver]);

  let borderColor = "border-elfy-green-dim/30";
  if (isDestroyed) borderColor = "border-elfy-red animate-pulse"; 
  else if (isInteracting && isDamaged) borderColor = "border-elfy-cyan shadow-[0_0_10px_#00F0FF]";
  else if (isDamaged) borderColor = "border-elfy-yellow/50";

  const randSeed = (title?.length || 5) % 2 === 0 ? 1 : -1;

  return (
    <motion.div 
      ref={registryRef}
      variants={panelVariants}
      initial="hidden"
      animate={isGameOver ? "shattered" : "visible"}
      custom={randSeed}
      className={clsx(
        "relative overflow-hidden flex flex-col group",
        "bg-black border",
        borderColor, 
        "shadow-[0_0_15px_rgba(11,212,38,0.05)]", 
        "rounded-sm",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(10,10,10,0.4)_50%)] z-0 bg-[length:100%_4px]" />
      
      {title && (
          <IntelligentHeader 
            title={title} 
            health={health} 
            isDestroyed={isDestroyed} 
            isGameOver={isGameOver}
            gameId={gameId}
          />
      )}

      <div className="relative z-10 p-4 h-full">
        <div className={clsx("h-full flex flex-col", isGameOver ? "invisible" : "visible")}>
            {children}
            {isDestroyed && (
                <BreachOverlay 
                    progress={healthPercent} 
                    isVideo={gameId === 'video'} 
                    showInteractive={true} 
                />
            )}
        </div>

        <AnimatePresence>
            {showReboot && <RebootOverlay key="reboot" />}
        </AnimatePresence>
        
        {isGameOver && (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black pointer-events-none">
                <Skull className="text-elfy-red animate-pulse w-20 h-20 drop-shadow-[0_0_15px_rgba(255,0,60,0.8)]" />
                <span className="text-elfy-red font-header font-black text-2xl tracking-widest drop-shadow-lg">SYSTEM FAILURE</span>
            </div>
        )}
      </div>
    </motion.div>
  );
};
