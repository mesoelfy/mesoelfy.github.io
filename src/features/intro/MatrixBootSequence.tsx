import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { ShieldAlert, Cpu, Unlock, Lock, Skull } from 'lucide-react';
import { ASCII_TITLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { GpuConfigPanel } from '../settings/components/GpuConfigPanel';
import { useStore } from '@/core/store/useStore';
import { clsx } from 'clsx';

interface Props {
  onComplete: () => void;
  onBreachStart: () => void;
}

// --- RESTORED ASCII RENDERER ---
const AsciiRenderer = () => {
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isHigh = graphicsMode === 'HIGH';

  const renderedChars = useMemo(() => {
    return ASCII_TITLE.split('').map((char, i) => {
      if (char === '\n') return <br key={i} />;
      if (char === ' ') return <span key={i}> </span>;

      let baseClass = 'transition-colors duration-300 ';
      let animClass = '';
      
      if (['█', '▀', '▄', '▌', '▐'].includes(char)) {
        baseClass += 'text-primary-green-dark';
        animClass = 'animate-matrix-green';
      } else if (['░', '▒', '▓'].includes(char)) {
        baseClass += 'text-latent-purple';
        animClass = 'animate-matrix-purple';
      } else {
        baseClass += 'text-primary-green-dark';
      }

      const finalClass = isHigh ? `${baseClass} ${animClass}` : baseClass;
      const style = isHigh ? { animationDelay: Math.random() * 2 + 's' } : {};

      return (
        <span 
          key={i} 
          className={finalClass} 
          style={style}
        >
          {char}
        </span>
      );
    });
  }, [isHigh]); 

  return (
    <div className="font-mono font-bold leading-[1.1] whitespace-pre text-center select-none overflow-hidden text-[9px] md:text-[11px] shrink-0">
      {renderedChars}
    </div>
  );
};

const BootHeader = ({ step }: { step: number }) => {
  const isUnsafe = step === 3;
  const isBypass = step === 4;
  const isSecure = step >= 5;

  let color = "text-primary-green-dim";
  let statusText = "ESTABLISHING...";
  let bgClass = "bg-primary-green/5";
  
  if (isUnsafe) {
      color = "text-critical-red";
      statusText = "SIGNAL_CORRUPTED";
      bgClass = "bg-critical-red/10 border-critical-red/30";
  } else if (isBypass) {
      color = "text-latent-purple-light";
      statusText = "INJECTING_PAYLOAD";
      bgClass = "bg-latent-purple/10 border-latent-purple/30";
  } else if (isSecure) {
      color = "text-primary-green";
      statusText = "UPLINK_STABLE";
      bgClass = "bg-primary-green/10 border-primary-green/30";
  } else if (step >= 1) {
      statusText = "HANDSHAKING...";
  }

  return (
    <div className={`flex shrink-0 items-center justify-between border-b border-white/10 ${bgClass} px-3 py-2 mb-2 select-none relative z-20 transition-all duration-300`}>
      <div className="flex flex-col leading-none gap-1.5 mt-0.5">
          <span className={`text-[10px] font-mono tracking-widest uppercase ${color} transition-colors duration-300 font-bold`}>
            BOOT_LOADER.SYS
          </span>
          <span className="text-[8px] text-gray-500 font-mono tracking-wider opacity-80">{statusText}</span>
      </div>
      
      <div className="flex gap-1 items-end h-3">
        {[1, 2, 3, 4].map(i => {
           let heightClass = "h-1";
           let animClass = "";
           let barColor = isUnsafe ? "bg-critical-red" : isBypass ? "bg-latent-purple-light" : "bg-primary-green";
           
           if (isUnsafe) {
               heightClass = i % 2 === 0 ? "h-3" : "h-1";
               animClass = "animate-pulse";
           } else if (isBypass) {
               heightClass = (step + i) % 2 === 0 ? "h-3" : "h-2";
           } else if (isSecure) {
               heightClass = "h-3"; 
           } else {
               heightClass = step >= (i-1) ? "h-2" : "h-0.5";
               animClass = step >= (i-1) ? "animate-pulse" : "";
           }

           return (
               <div 
                 key={i} 
                 className={`w-1 rounded-sm transition-all duration-300 ${barColor} ${animClass} ${heightClass}`} 
                 style={{ opacity: isSecure ? 1 : 0.7 }} 
               />
           );
        })}
      </div>
    </div>
  );
};

const CoreHeader = ({ step }: { step: number }) => {
  const isUnsafe = step === 3;
  const isBypass = step === 4;
  const isDecrypted = step === 5;
  const isCaution = step >= 6;

  const [showCpu, setShowCpu] = useState(false);

  useEffect(() => {
    if (step === 5) {
      setShowCpu(false);
      const timer = setTimeout(() => {
        setShowCpu(true);
      }, 700); 
      return () => clearTimeout(timer);
    }
  }, [step]);

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

  return (
    <motion.div 
      className={`flex shrink-0 items-center justify-between border-b px-3 py-2 mb-2 select-none transition-colors duration-500 ${!isCaution ? `${borderColor} ${bgColor}` : ''}`}
      animate={isCaution ? {
        borderColor: ['rgba(120,246,84,0.3)', 'rgba(234,231,71,0.6)', 'rgba(120,246,84,0.3)'],
        backgroundColor: ['rgba(120,246,84,0.1)', 'rgba(234,231,71,0.15)', 'rgba(120,246,84,0.1)'],
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.span 
        className={`text-sm font-mono font-bold tracking-widest uppercase ${!isCaution ? textColor : ''}`}
        animate={isCaution ? {
            color: ['#78F654', '#eae747', '#78F654']
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        MESOELFY_CORE
      </motion.span>
      
      <div className="relative w-6 h-6 flex items-center justify-center">
         <AnimatePresence mode="wait">
            {isUnsafe ? (
                <motion.div 
                    key="unsafe"
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1, x: [-2, 2, -2, 2, 0] }}
                    exit={{ scale: 0 }}
                    transition={{ x: { repeat: Infinity, duration: 0.1 } }}
                >
                    <ShieldAlert size={18} className="text-critical-red" />
                </motion.div>
            ) : isBypass ? (
                <motion.div 
                    key="bypass"
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1.1 }} 
                    exit={{ opacity: 0, scale: 0, transition: { duration: 0.2, repeat: 0 } }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                >
                     <Unlock size={18} className="text-latent-purple-light" />
                </motion.div>
            ) : isCaution ? (
                <motion.div 
                    key="caution"
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <motion.div
                       animate={{
                           filter: ['drop-shadow(0 0 8px rgba(120,246,84,0.8))', 'drop-shadow(0 0 15px rgba(234,231,71,1))', 'drop-shadow(0 0 8px rgba(120,246,84,0.8))'],
                           color: ['#78F654', '#eae747', '#78F654'],
                           rotate: [0, 8, -8, 0] 
                       }}
                       transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
                    >
                         <Skull size={18} />
                    </motion.div>
                </motion.div>
            ) : isDecrypted ? (
                !showCpu ? (
                    <motion.div 
                        key="locked"
                        initial={{ scale: 1.5, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                         <Lock size={18} className="text-primary-green drop-shadow-[0_0_8px_rgba(120,246,84,0.8)]" />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="cpu"
                        initial={{ scale: 0, rotate: -45 }} 
                        animate={{ scale: 1, rotate: 0 }} 
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.4, ease: "backOut" }}
                    >
                         <Cpu size={18} className="text-primary-green drop-shadow-[0_0_8px_rgba(120,246,84,0.8)]" />
                    </motion.div>
                )
            ) : (
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

const TypedLog = ({ text, color, speed = 20, showDots = false, isActive = false, isPast = false }: any) => {
  const [displayed, setDisplayed] = useState("");
  const [isDoneTyping, setIsDoneTyping] = useState(false);
  
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setIsDoneTyping(false);
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        setIsDoneTyping(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  if (isPast && displayed !== text) {
    setDisplayed(text);
    setIsDoneTyping(true);
  }

  return (
    <div className={`whitespace-nowrap font-mono ${color} flex items-center shrink-0`}>
      <span>{displayed}</span>
      {isDoneTyping && showDots && <span>{isPast ? '...' : (Math.floor(Date.now() / 300) % 4 === 0 ? '' : '...')}</span>}
      {isActive && <span className="ml-1 animate-cursor-blink text-primary-green font-bold">_</span>}
    </div>
  );
};

const LOG_DATA = [
  { text: "> INITIALIZE NEURAL_LACE", color: "text-primary-green-dim", speed: 40, hasDots: true },
  { text: "> CONNECTED TO LATENT_SPACE.", color: "text-primary-green", speed: 20, hasDots: false },
  { text: "> MOUNT MESOELFY_CORE", color: "text-primary-green-dim", speed: 40, hasDots: true },
  { text: "> ⚠ UNSAFE CONNECTION DETECTED ⚠", color: "text-critical-red", speed: 20, hasDots: false },
  { text: "> BYPASSING SENTINEL_NODES", color: "text-latent-purple-light", speed: 40, hasDots: true },
  { text: "> DECRYPTED.", color: "text-primary-green", speed: 20, hasDots: false },
  { text: "> ⚠ PROCEED WITH CAUTION ⚠", color: "text-alert-yellow", speed: 20, hasDots: false },
];

export const MatrixBootSequence = ({ onComplete, onBreachStart }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainStackRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState(0); 
  const stepRef = useRef(0);
  const [isBreaching, setIsBreaching] = useState(false);
  const [showGpuPanel, setShowGpuPanel] = useState(false); 

  const logsToShow = LOG_DATA.slice(0, step + 1);
  
  const showMatrix = step >= 1;       
  const showPayloadWindow = step >= 2; 
  const showWarningBox = step >= 3;    
  const showButton = step >= 6;        

  useEffect(() => {
    stepRef.current = step;
    if (LOG_DATA[step]) {
        GameEventBus.emit(GameEvents.BOOT_LOG, { message: LOG_DATA[step].text });
    }
    
    // Trigger GPU Panel Delay
    if (step >= 6 && !showGpuPanel) {
        const timer = setTimeout(() => {
            setShowGpuPanel(true);
            AudioSystem.playSound('ui_menu_open');
        }, 1000); 
        return () => clearTimeout(timer);
    }
  }, [step, showGpuPanel]);

  // SCROLL FIX: When GPU Panel appears, keep the Main Stack centered visually.
  useEffect(() => {
    if (showGpuPanel && mainStackRef.current) {
        mainStackRef.current.scrollIntoView({ inline: 'center', behavior: 'auto' });
    }
  }, [showGpuPanel]);

  useEffect(() => {
    const sequence = [
      { t: 3000, step: 1 }, 
      { t: 4000, step: 2 }, 
      { t: 8000, step: 3 }, 
      { t: 9500, step: 4 }, 
      { t: 11500, step: 5 }, 
      { t: 13500, step: 6 }, 
    ];
    const timeouts = sequence.map(({ t, step: s }) => setTimeout(() => {
      if (!isBreaching) setStep(s);
    }, t));
    return () => timeouts.forEach(clearTimeout);
  }, [isBreaching]);

  useEffect(() => {
    if (!showMatrix && !isBreaching) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 20);
    const ypos = Array(cols).fill(0).map(() => Math.random() * -1000);

    const matrixEffect = () => {
      const mode = useStore.getState().graphicsMode;
      if (mode === 'POTATO') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px "Courier New"';

      const currentStep = stepRef.current;
      const isUnsafePhase = currentStep >= 3;
      
      ypos.forEach((y, ind) => {
        const charSet = Math.random() > 0.5 ? 0x16A0 : 0x2200; 
        const text = String.fromCharCode(charSet + Math.random() * 64);
        const x = ind * 20;

        const isPurple = Math.random() > 0.6;
        const isRed = isUnsafePhase && Math.random() > 0.6; 
        let color = '#0F0';
        let blur = 0;

        if (isRed) {
            color = '#FF003C';
            blur = 8;
        } else if (isPurple) {
            color = '#9E4EA5';
            blur = 8;
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;

        const speed = isBreaching ? 100 : 20; 
        if (y > canvas.height + Math.random() * 10000) ypos[ind] = 0;
        else ypos[ind] = y + speed;
      });
    };
    const interval = setInterval(matrixEffect, 50);
    return () => clearInterval(interval);
  }, [showMatrix, isBreaching]); 

  const handleInitialize = () => {
    if (isBreaching) return;
    setIsBreaching(true);
    onBreachStart();
    AudioSystem.init();
    AudioSystem.playBootSequence();
    AudioSystem.startMusic();
    setStep(6);
    setTimeout(onComplete, 800); 
  };

  return (
    <motion.div 
      ref={containerRef}
      animate={{ backgroundColor: isBreaching ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={clsx(
        "fixed inset-0 z-[100] font-mono outline-none cursor-none scrollbar-thin scrollbar-thumb-primary-green scrollbar-track-black",
        isBreaching ? "overflow-hidden" : "overflow-auto"
      )}
    >
      <canvas ref={canvasRef} className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 ${showMatrix && !isBreaching ? 'opacity-30' : 'opacity-0'}`} />

      {/* 
         LAYOUT FIX: INCREASED PADDING FOR SCROLL DISTANCE
         - 'px-8' -> 'lg:px-32' provides massive horizontal breathing room on large screens.
         - This ensures that if the user scrolls to the left/right edges, the content isn't flush against the bezel.
      */}
      <div className="min-h-full w-full flex p-8 lg:px-32 relative z-10">
        
        <motion.div 
            className={clsx(
                "w-fit m-auto flex flex-col gap-4",
                showGpuPanel && !isBreaching 
                    ? "lg:grid lg:grid-cols-[18rem_42rem_18rem] lg:gap-8 lg:items-end" 
                    : "max-w-2xl"
            )}
            animate={isBreaching ? { scale: 15, opacity: 0, filter: "blur(10px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ scale: { duration: 0.8, ease: "easeIn" }, opacity: { duration: 0.2, ease: "easeIn" }, filter: { duration: 0.2 } }}
        >
            
            {/* 1. GPU PANEL (Desktop: Col 1) */}
            <AnimatePresence>
                {showGpuPanel && !isBreaching && (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        className="w-full lg:w-72 lg:col-start-1 lg:row-start-1 relative z-10 lg:justify-self-end order-2 lg:order-1"
                    >
                        <GpuConfigPanel />
                        <div className="mt-2 text-[10px] font-mono text-gray-500 text-center uppercase tracking-widest md:text-left absolute top-full w-full">
                            &gt;&gt; CAN BE CHANGED LATER.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. MAIN TERMINAL (Desktop: Col 2) */}
            <div ref={mainStackRef} className="w-full max-w-2xl lg:w-[42rem] lg:col-start-2 lg:row-start-1 flex flex-col gap-4 order-1 lg:order-2">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-black/90 border border-primary-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden shrink-0 relative z-20">
                    <BootHeader step={step} />
                    <div className="p-4 pt-2 h-40 flex flex-col justify-start text-xs md:text-sm font-mono relative z-10 leading-relaxed">
                        {logsToShow.map((line, i) => (
                        <TypedLog key={i} text={line.text} color={line.color} speed={line.speed} showDots={line.hasDots} isActive={i === step && !isBreaching} isPast={i < step} />
                        ))}
                    </div>
                </motion.div>

                <AnimatePresence>
                {showPayloadWindow && (
                    <motion.div 
                    initial={{ y: 50, opacity: 0, height: 0 }}
                    animate={{ y: 0, opacity: 1, height: "auto" }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className="w-full bg-black/90 border border-primary-green shadow-[0_0_40px_rgba(0,255,65,0.15)] overflow-hidden shrink-0 relative z-20"
                    >
                    <CoreHeader step={step} />
                    <div className="p-6 flex flex-col items-center gap-4">
                        <AsciiRenderer />
                        {showWarningBox && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ 
                            opacity: 1, scale: 1,
                            boxShadow: ["0 0 10px rgba(255, 0, 60, 0.2)", "0 0 40px rgba(255, 0, 60, 0.6)", "0 0 10px rgba(255, 0, 60, 0.2)"]
                            }}
                            transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 }, boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
                            className="relative border border-critical-red bg-critical-red/10 w-fit mx-auto flex items-center justify-center gap-4 py-2 px-6 select-none shrink-0"
                        >
                            <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-3xl text-critical-red">⚠</motion.span>
                            <span className="text-sm font-header font-black tracking-widest text-center text-critical-red whitespace-nowrap pb-0.5">UNSAFE CONNECTION DETECTED</span>
                            <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-3xl text-critical-red">⚠</motion.span>
                        </motion.div>
                        )}
                        {showButton && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="shrink-0">
                            <button 
                            onClick={handleInitialize}
                            onMouseEnter={() => AudioSystem.playHover()}
                            className="group relative px-8 py-2 overflow-hidden border border-primary-green transition-all hover:shadow-[0_0_30px_rgba(0,255,65,0.6)] cursor-none"
                            >
                            <div className="absolute inset-0 bg-primary-green translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <span className="relative z-10 font-mono font-bold text-xl md:text-3xl text-primary-green group-hover:text-black transition-colors block tracking-widest whitespace-nowrap">
                                [ INITIALIZE_SYSTEM.EXE ]
                            </span>
                            </button>
                        </motion.div>
                        )}
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* 3. SPACER (Desktop: Col 3) - Only if GPU Panel exists to balance */}
            {showGpuPanel && !isBreaching && (
                <div className="hidden lg:block w-72 lg:col-start-3 lg:row-start-1" />
            )}

        </motion.div>
      </div>
    </motion.div>
  );
};
