import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const ASCII_TITLE = `
 ███▄ ▄███▓▓█████  ██████  ▒█████  ▓█████  ██▓      █████▒▓██   ██▓
▓██▒▀█▀ ██▒▓█   ▀▒██    ▒ ▒██▒  ██▒▓█   ▀ ▓██▒    ▓██   ▒  ▒██  ██▒
▓██    ▓██░▒███  ░ ▓██▄   ▒██░  ██▒▒███   ▒██░    ▒████ ░   ▒██ ██░
▒██    ▒██ ▒▓█  ▄  ▒   ██▒▒██   ██░▒▓█  ▄ ▒██░    ░▓█▒  ░   ░ ▐██▓░
▒██▒   ░██▒░▒████▒██████▒▒░ ████▓▒░░▒████▒░██████▒░▒█░      ░ ██▒▓░
░ ▒░   ░  ░░░ ▒░ ░ ▒░▓  ░ ░ ▒░▒░▒░ ░░ ▒░ ░░ ▒░▓  ░ ▒ ░       ██▒▒▒ 
░  ░      ░ ░ ░  ░ ░ ▒  ░   ░ ▒ ▒░  ░ ░  ░░ ░ ▒  ░ ░       ▓██ ░▒░ 
░      ░      ░    ░ ░    ░ ░ ░ ▒     ░     ░ ░    ░ ░     ▒ ▒ ░░  
       ░      ░  ░   ░  ░     ░ ░     ░  ░    ░  ░         ░ ░     
                                                           ░ ░     
`;

// --- Bespoke Header Icons ---
const BootHeader = () => (
  <div className="flex items-center justify-between border-b border-elfy-green-dim/30 bg-elfy-green/5 px-3 py-1 mb-2 select-none relative z-20">
    <span className="text-[10px] text-elfy-green-dim font-mono tracking-widest uppercase translate-y-[1px]">BOOT_LOADER.SYS</span>
    <div className="flex gap-1 items-center">
      {[1, 2, 3].map(i => (
        <div key={i} className="w-1 bg-elfy-green/50 animate-pulse" style={{ height: `${i * 4 + 4}px`, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  </div>
);

const CoreHeader = () => (
  <div className="flex items-center justify-between border-b border-elfy-green/30 bg-elfy-green/10 px-3 py-1 mb-2 select-none">
    <span className="text-[10px] text-elfy-green font-mono tracking-widest uppercase font-bold translate-y-[1px]">MESOELFY_CORE</span>
    <div className="relative w-3 h-3 flex items-center justify-center">
      <div className="absolute inset-0 border border-elfy-green rounded-full animate-spin-slow border-t-transparent" />
      <div className="w-1 h-1 bg-elfy-green rounded-full animate-pulse" />
    </div>
  </div>
);

// --- Sub-Component: Typed Log Line ---
const TypedLog = ({ text, color }: { text: string, color: string }) => {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <div className={`whitespace-nowrap ${color}`}>{displayed}</div>;
};

// --- DATA SOURCE ---
const LOG_SCRIPT = [
  { text: "> INITIALIZING NEURAL_LACE...", color: "text-elfy-green-dim" },
  { text: "> CONNECTED TO LATENT_SPACE.", color: "text-elfy-green" },
  { text: "> MOUNTING MESOELFY_CORE...", color: "text-elfy-green-dim" },
  { text: "> ⚠ UNSAFE CONNECTION DETECTED ⚠", color: "text-elfy-red" },
  { text: "> BYPASSING SENTINEL_NODES...", color: "text-elfy-green-dim" }, // Fixed Color
  { text: "> DECRYPTED.", color: "text-elfy-purple-light" },
  { text: "> ⚠ PROCEED WITH CAUTION ⚠", color: "text-elfy-yellow" },
];

export const MatrixBootSequence = ({ onComplete }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [progress, setProgress] = useState(0); 
  const [isBreaching, setIsBreaching] = useState(false);

  // Derived State
  const logsToShow = LOG_SCRIPT.slice(0, progress);
  const showMatrix = progress >= 1;
  const showPayloadWindow = progress >= 3;
  const showWarningBox = progress >= 4;
  const showButton = progress >= 7;

  // 1. STORY TIMELINE
  useEffect(() => {
    const sequence = [
      { t: 200,  step: 1 },
      { t: 1000, step: 2 },
      { t: 2200, step: 3 }, // Window 2
      { t: 3500, step: 4 }, // Warning
      { t: 4500, step: 5 }, 
      { t: 5500, step: 6 }, 
      { t: 6500, step: 7 }, // Button
    ];

    const timeouts = sequence.map(({ t, step }) => {
      return setTimeout(() => {
        if (!isBreaching) setProgress(step);
      }, t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [isBreaching]);

  // 2. MATRIX RAIN
  useEffect(() => {
    if (!showMatrix) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 20);
    const ypos = Array(cols).fill(0).map(() => Math.random() * -1000);

    const matrixEffect = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0F0';
      ctx.font = '14px "Courier New"';

      ypos.forEach((y, ind) => {
        const charSet = Math.random() > 0.5 ? 0x16A0 : 0x2200; 
        const text = String.fromCharCode(charSet + Math.random() * 64);
        const x = ind * 20;
        ctx.fillText(text, x, y);
        const speed = isBreaching ? 80 : 20; 
        if (y > canvas.height + Math.random() * 10000) ypos[ind] = 0;
        else ypos[ind] = y + speed;
      });
    };
    const interval = setInterval(matrixEffect, 50);
    return () => clearInterval(interval);
  }, [showMatrix, isBreaching]);

  // 3. DEV SHORTCUT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBreaching) handleInitialize();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBreaching]);

  // 4. THE BREACH
  const handleInitialize = () => {
    setIsBreaching(true);
    setProgress(7); 
    setTimeout(onComplete, 500); // Shorter wait since fade is fast
  };

  return (
    // FIX: Outer motion.div handles the instant blackout fade
    <motion.div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center font-mono overflow-hidden"
      // Anchor to top (pt-32) so windows grow DOWN, not out from center
      style={{ justifyContent: 'flex-start', paddingTop: '15vh' }}
      animate={isBreaching ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeIn" }} // FAST fade to reveal grid
    >
      
      {/* Background Matrix */}
      <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 z-0 transition-opacity duration-300 ${showMatrix ? 'opacity-30' : 'opacity-0'}`} 
      />

      {/* CONTAINER */}
      <motion.div 
        className="relative z-10 flex flex-col gap-4 items-center w-full max-w-2xl px-4"
        animate={isBreaching ? { scale: 15, filter: "blur(10px)" } : { scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeIn" }}
      >

        {/* WINDOW 1: BOOT LOADER */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-black/90 border border-elfy-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden"
        >
          <BootHeader />
          <div className="p-4 pt-2 h-40 flex flex-col justify-start text-xs md:text-sm font-mono relative z-10 leading-relaxed">
            {logsToShow.map((line, i) => (
              <TypedLog key={i} text={line.text} color={line.color} />
            ))}
            {!isBreaching && <div className="animate-pulse text-elfy-green">_</div>}
          </div>
        </motion.div>

        {/* WINDOW 2: PAYLOAD */}
        <AnimatePresence>
          {showPayloadWindow && (
            <motion.div 
              // Removed 'layout' from here to prevent distortion
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="w-full bg-black/90 border border-elfy-green shadow-[0_0_40px_rgba(0,255,65,0.15)] overflow-hidden"
            >
              <CoreHeader />
              
              <div className="p-6 flex flex-col items-center gap-6">
                
                {/* ASCII Title */}
                <pre className="text-[6px] md:text-[10px] leading-[6px] md:leading-[10px] text-elfy-green font-bold text-center whitespace-pre overflow-x-hidden select-none">
                  {ASCII_TITLE}
                </pre>

                {/* WRAPPER FOR DYNAMIC CONTENT (Smooth Growth) */}
                <motion.div 
                  className="flex flex-col items-center gap-6 w-full"
                  animate={{ height: "auto" }} // Smoothly animate height changes
                  transition={{ duration: 0.3 }}
                >
                  {/* WARNING BOX */}
                  {showWarningBox && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        boxShadow: [
                          "0 0 0px rgba(255, 0, 60, 0)",
                          "0 0 30px rgba(255, 0, 60, 0.6)",
                          "0 0 10px rgba(255, 0, 60, 0.2)",
                          "0 0 30px rgba(255, 0, 60, 0.6)",
                          "0 0 0px rgba(255, 0, 60, 0)"
                        ]
                      }}
                      transition={{ 
                        opacity: { duration: 0.3 },
                        scale: { duration: 0.3 },
                        boxShadow: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="relative border border-elfy-red bg-elfy-red/10 px-8 py-3 text-xs font-bold tracking-[0.15em] text-center text-elfy-red select-none"
                    >
                      <span className="animate-ping absolute left-3 top-3 opacity-75">⚠</span>
                      UNSAFE CONNECTION DETECTED
                      <span className="animate-ping absolute right-3 top-3 opacity-75">⚠</span>
                    </motion.div>
                  )}

                  {/* BUTTON */}
                  {showButton && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <button 
                        onClick={handleInitialize}
                        className="group relative px-10 py-4 overflow-hidden border border-elfy-green transition-all hover:shadow-[0_0_30px_rgba(0,255,65,0.6)]"
                      >
                        <div className="absolute inset-0 bg-elfy-green translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10 font-mono text-lg font-bold text-elfy-green group-hover:text-black transition-colors">
                          [ INITIALIZE_SYSTEM.EXE ]
                        </span>
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};
