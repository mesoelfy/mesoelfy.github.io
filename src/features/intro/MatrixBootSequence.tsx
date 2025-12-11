import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { ShieldAlert, Cpu, Unlock, Lock, Skull, Monitor, Settings2 } from 'lucide-react';
import { ASCII_TITLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { GraphicsToggle } from '@/ui/atoms/GraphicsToggle';

interface Props {
  onComplete: () => void;
  onBreachStart: () => void;
}

// --- ASCII RENDERER ---
const AsciiRenderer = () => {
  const renderedChars = useMemo(() => {
    return ASCII_TITLE.split('').map((char, i) => {
      if (char === '\\n') return <br key={i} />;
      if (char === ' ') return <span key={i}> </span>;

      let animClass = '';
      if (['█', '▀', '▄', '▌', '▐'].includes(char)) {
        animClass = 'animate-matrix-green text-primary-green-dark';
      } else if (['░', '▒', '▓'].includes(char)) {
        animClass = 'animate-matrix-purple text-latent-purple';
      } else {
        animClass = 'text-primary-green-dark';
      }
      return <span key={i} className={animClass} style={{ animationDelay: Math.random() * 2 + 's' }}>{char}</span>;
    });
  }, []);

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
  
  if (isUnsafe) { color = "text-critical-red"; statusText = "SIGNAL_CORRUPTED"; bgClass = "bg-critical-red/10 border-critical-red/30"; } 
  else if (isBypass) { color = "text-latent-purple-light"; statusText = "INJECTING_PAYLOAD"; bgClass = "bg-latent-purple/10 border-latent-purple/30"; } 
  else if (isSecure) { color = "text-primary-green"; statusText = "UPLINK_STABLE"; bgClass = "bg-primary-green/10 border-primary-green/30"; } 
  else if (step >= 1) { statusText = "HANDSHAKING..."; }

  return (
    <div className={`flex shrink-0 items-center justify-between border-b border-white/10 ${bgClass} px-3 py-2 mb-2 select-none relative z-20 transition-all duration-300`}>
      <div className="flex flex-col leading-none gap-1.5 mt-0.5">
          <span className={`text-[10px] font-mono tracking-widest uppercase ${color} transition-colors duration-300 font-bold`}>BOOT_LOADER.SYS</span>
          <span className="text-[8px] text-gray-500 font-mono tracking-wider opacity-80">{statusText}</span>
      </div>
      <div className="flex gap-1 items-end h-3">
        {[1, 2, 3, 4].map(i => (
           <div key={i} className={`w-1 rounded-sm transition-all duration-300 ${isUnsafe ? "bg-critical-red h-2 animate-pulse" : "bg-primary-green h-1"}`} style={{ opacity: isSecure ? 1 : 0.7 }} />
        ))}
      </div>
    </div>
  );
};

const HardwareHeader = () => (
  <div className="flex shrink-0 items-center justify-between border-b border-primary-green/30 bg-primary-green/10 px-3 py-3 select-none">
      <div className="flex items-center gap-2">
          <Settings2 size={14} className="text-primary-green animate-spin-slow" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-primary-green">GPU_CONFIG</span>
      </div>
  </div>
);

const CoreHeader = ({ step }: { step: number }) => {
  const isCaution = step >= 6;
  return (
    <motion.div 
      className={`flex shrink-0 items-center justify-between border-b px-3 py-2 mb-2 select-none transition-colors duration-500 ${!isCaution ? 'border-primary-green/30 bg-primary-green/10' : ''}`}
      animate={isCaution ? { borderColor: ['rgba(120,246,84,0.3)', 'rgba(234,231,71,0.6)', 'rgba(120,246,84,0.3)'] } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="text-sm font-mono font-bold tracking-widest uppercase text-primary-green">MESOELFY_CORE</span>
      <div className="relative w-6 h-6 flex items-center justify-center">
         {isCaution ? <Skull size={18} className="text-primary-green" /> : <Lock size={18} className="text-primary-green" />}
      </div>
    </motion.div>
  );
};

const TypedLog = ({ text, color, speed = 20, showDots = false, isActive = false, isPast = false }: any) => {
  const [displayed, setDisplayed] = useState("");
  const [isDoneTyping, setIsDoneTyping] = useState(false);
  useEffect(() => {
    let i = 0; setDisplayed(""); setIsDoneTyping(false);
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1)); i++;
      if (i >= text.length) { setIsDoneTyping(true); clearInterval(interval); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  if (isPast && displayed !== text) { setDisplayed(text); setIsDoneTyping(true); }
  return (
    <div className={`whitespace-nowrap font-mono ${color} flex items-center shrink-0`}>
      <span>{displayed}</span>{isDoneTyping && showDots && <span>{isPast ? '...' : (Math.floor(Date.now() / 300) % 4 === 0 ? '' : '...')}</span>}{isActive && <span className="ml-1 animate-cursor-blink text-primary-green font-bold">_</span>}
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
  const [step, setStep] = useState(0); 
  const stepRef = useRef(0);
  const [isBreaching, setIsBreaching] = useState(false);
  const logsToShow = LOG_DATA.slice(0, step + 1);
  
  const showMatrix = step >= 1;       
  const showPayloadWindow = step >= 2; 
  const showWarningBox = step >= 3;    
  const showButton = step >= 6;        
  const [showOptimizer, setShowOptimizer] = useState(false);

  useEffect(() => {
    stepRef.current = step;
    if (LOG_DATA[step]) GameEventBus.emit(GameEvents.BOOT_LOG, { message: LOG_DATA[step].text });
  }, [step]);

  useEffect(() => {
    const sequence = [
      { t: 3000, step: 1 }, { t: 4000, step: 2 }, { t: 8000, step: 3 }, 
      { t: 9500, step: 4 }, { t: 11500, step: 5 }, { t: 13500, step: 6 }, 
      { t: 14500, setShowOptimizer: true }, 
    ];
    const timeouts = sequence.map(({ t, step: s, setShowOptimizer: setOpt }) =>
      setTimeout(() => { if (setOpt !== undefined) setShowOptimizer(setOpt); else if (!isBreaching) setStep(s); }, t)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [isBreaching]);

  useEffect(() => {
    if (!showMatrix && !isBreaching) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 20); const ypos = Array(cols).fill(0).map(() => Math.random() * -1000);
    const matrixEffect = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.font = '14px "Courier New"';
      ypos.forEach((y, ind) => {
        const text = String.fromCharCode(0x16A0 + Math.random() * 64);
        const x = ind * 20;
        ctx.fillStyle = '#0F0';
        ctx.fillText(text, x, y);
        ypos[ind] = (y > canvas.height + Math.random() * 10000) ? 0 : y + 20;
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-start pt-[20vh] md:pt-[25vh] font-mono overflow-hidden outline-none cursor-none"
    >
      <canvas ref={canvasRef} className={`absolute inset-0 z-0 transition-opacity duration-300 ${showMatrix && !isBreaching ? 'opacity-30' : 'opacity-0'}`} />

      {/* CENTER STACK */}
      <motion.div 
        className="relative z-10 flex flex-col gap-4 items-center w-full max-w-2xl px-4"
        animate={isBreaching ? { scale: 15, opacity: 0, filter: "blur(10px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ scale: { duration: 0.8, ease: "easeIn" }, opacity: { duration: 0.2, ease: "easeIn" }, filter: { duration: 0.2 } }}
      >
        {/* LEFT SIDE PANEL (Optimization) - Positioned Absolutely relative to this centered container */}
        <AnimatePresence>
          {showOptimizer && !isBreaching && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.5, ease: "backOut", delay: 0.2 }}
              className="absolute right-[100%] top-[45%] -translate-y-1/2 mr-6 w-64 hidden lg:flex flex-col bg-black/90 border border-primary-green-dim/50 shadow-[0_0_30px_rgba(0,255,65,0.1)] overflow-hidden"
            >
              <HardwareHeader />
              <div className="flex flex-row">
                  {/* Decorative Vertical Strip */}
                  <div className="w-6 border-r border-white/10 bg-white/5 flex flex-col items-center justify-center py-2 gap-2">
                      <div className="text-[6px] font-mono text-primary-green-dim writing-vertical rotate-180 tracking-widest opacity-50">
                          SYSTEM_OPTIMIZATION
                      </div>
                      <div className="w-1 h-1 bg-primary-green rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-primary-green rounded-full animate-pulse delay-100" />
                      <div className="w-1 h-1 bg-primary-green rounded-full animate-pulse delay-200" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col items-center gap-3">
                      <div className="text-[9px] text-primary-green-dim font-mono tracking-wider text-center mb-1 leading-tight">
                          SELECT PERFORMANCE PROFILE:
                      </div>
                      <GraphicsToggle layout="vertical" />
                      
                      <div className="w-full border-t border-white/10 pt-2 mt-1">
                          <p className="text-[7px] text-gray-500 font-mono text-center leading-relaxed">
                              &gt;&gt; CAN BE CHANGED LATER IN SETTINGS.
                          </p>
                      </div>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- MAIN COLUMN --- */}

        {/* 1. BOOT LOADER */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-black/90 border border-primary-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden shrink-0">
          <BootHeader step={step} />
          <div className="p-4 pt-2 h-40 flex flex-col justify-start text-xs md:text-sm font-mono relative z-10 leading-relaxed">
            {logsToShow.map((line, i) => (
              <TypedLog key={i} text={line.text} color={line.color} speed={line.speed} showDots={line.hasDots} isActive={i === step && !isBreaching} isPast={i < step} />
            ))}
          </div>
        </motion.div>

        {/* 2. MESOELFY CORE */}
        <AnimatePresence>
          {showPayloadWindow && (
            <motion.div 
              initial={{ y: 50, opacity: 0, height: 0 }}
              animate={{ y: 0, opacity: 1, height: "auto" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="w-full bg-black/90 border border-primary-green shadow-[0_0_40px_rgba(0,255,65,0.15)] overflow-hidden shrink-0"
            >
              <CoreHeader step={step} />
              <div className="p-6 flex flex-col items-center gap-6">
                <AsciiRenderer />
                {showWarningBox && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ opacity: { duration: 0.3 } }}
                    className="relative border border-critical-red bg-critical-red/10 w-fit mx-auto flex items-center justify-center gap-4 py-2 px-6 select-none shrink-0"
                  >
                    <span className="text-sm font-header font-black tracking-widest text-center text-critical-red whitespace-nowrap pb-0.5">UNSAFE CONNECTION DETECTED</span>
                  </motion.div>
                )}
                {showButton && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="shrink-0 flex flex-col items-center gap-4 w-full">
                    <button 
                      onClick={handleInitialize}
                      onMouseEnter={() => AudioSystem.playHover()}
                      className="group relative px-8 py-4 overflow-hidden border border-primary-green transition-all hover:shadow-[0_0_30px_rgba(0,255,65,0.6)] cursor-none w-full"
                    >
                      <div className="absolute inset-0 bg-primary-green translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative z-10 font-mono font-bold text-xl md:text-2xl text-primary-green group-hover:text-black transition-colors block tracking-widest whitespace-nowrap">
                        [ INITIALIZE_SYSTEM.EXE ]
                      </span>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MOBILE FALLBACK: If screen is small, show optimizer below Core */}
        <AnimatePresence>
          {showOptimizer && !isBreaching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:hidden bg-black/90 border border-primary-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden shrink-0 mt-2"
            >
              <HardwareHeader />
              <div className="p-4 flex flex-col items-center gap-3">
                  <GraphicsToggle layout="horizontal" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};
