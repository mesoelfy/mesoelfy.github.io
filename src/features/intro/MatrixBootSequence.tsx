import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

const ASCII_TITLE = `
 ███▄ ▄███▓▓█████  ██████  ▒█████  ▓█████  ██▓      █████▒▓██   ██▓
▓██▒▀█▀ ██▒▓█   ▀▒██    ▒ ▒██▒  ██▒▓█   ▀ ▓██▒    ▒▓█   ▒  ▒██  ██▒
▓██    ▓██░▒███  ░ ▓██▄   ▒██░  ██▒▒███   ▒██░    ▒▓███ ░   ▒██ ██░
▒██    ▒██ ▒▓█  ▄  ▒   ██▒▒██   ██░▒▓█  ▄ ▒██░    ░▓█▒  ░   ░ ▐██░░
▒██▒   ░██▒░▒████▒██████▒▒░ ████▓▒░░▒████▒░██████▒░▒█░      ░ ██▒░░
░ ▒░   ░  ░░░ ▒░ ░ ▒░▒  ░ ░ ▒░▒░▒░ ░░ ▒░ ░░ ▒░▒  ░ ▒ ░       ██▒▒▒
░  ░      ░ ░ ░  ░ ░ ▒  ░   ░ ▒ ▒░  ░ ░  ░░ ░ ▒  ░ ░       ▓██ ░▒░ 
░      ░      ░    ░ ░    ░ ░ ░ ▒     ░     ░ ░    ░ ░     ▒ ▒ ░░  
       ░      ░  ░   ░  ░     ░ ░     ░  ░    ░  ░         ░ ░     
                                                                 
`;

const BootHeader = () => (
  <div className="flex items-center justify-between border-b border-elfy-green-dim/30 bg-elfy-green/5 px-3 py-1 mb-2 select-none relative z-20">
    <span className="text-xs text-elfy-green-dim font-mono tracking-widest uppercase">BOOT_LOADER.SYS</span>
    <div className="flex gap-1 items-center">
      {[1, 2, 3].map(i => (
        <div key={i} className="w-1 bg-elfy-green/50 animate-pulse" style={{ height: `${i * 4 + 4}px`, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  </div>
);

const CoreHeader = () => (
  <div className="flex items-center justify-between border-b border-elfy-green/30 bg-elfy-green/10 px-3 py-1 mb-2 select-none">
    <span className="text-sm text-elfy-green font-mono font-bold tracking-widest uppercase">MESOELFY_CORE</span>
    <div className="relative w-3 h-3 flex items-center justify-center">
      <div className="absolute inset-0 border border-elfy-green rounded-full animate-spin-slow border-t-transparent" />
      <div className="w-1 h-1 bg-elfy-green rounded-full animate-pulse" />
    </div>
  </div>
);

const LoadingDots = () => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 300);
    return () => clearInterval(interval);
  }, []);
  return <span>{dots}</span>;
}

const TypedLog = ({ text, color, speed = 20, showDots = false }: { text: string, color: string, speed?: number, showDots?: boolean }) => {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        setIsDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className={`whitespace-nowrap font-mono ${color}`}>
      {displayed}
      {isDone && showDots && <LoadingDots />}
    </div>
  );
};

const LOG_DATA = [
  { text: "> INITIALIZE NEURAL_LACE", color: "text-elfy-green-dim", speed: 40 },
  { text: "> CONNECTED TO LATENT_SPACE.", color: "text-elfy-green", speed: 20 },
  { text: "> MOUNT MESOELFY_CORE", color: "text-elfy-green-dim", speed: 40 },
  { text: "> ⚠ UNSAFE CONNECTION DETECTED ⚠", color: "text-elfy-red", speed: 20 },
  { text: "> BYPASSING SENTINEL_NODES", color: "text-elfy-purple-light", speed: 40 },
  { text: "> DECRYPTED.", color: "text-elfy-green", speed: 20 },
  { text: "> ⚠ PROCEED WITH CAUTION ⚠", color: "text-elfy-yellow", speed: 20 },
];

export const MatrixBootSequence = ({ onComplete }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0); 
  const [isBreaching, setIsBreaching] = useState(false);

  const logsToShow = LOG_DATA.slice(0, step);
  
  const getShowDots = (index: number) => {
    if (index === 0 && step === 1) return true;
    if (index === 2 && step === 3) return true;
    if (index === 4 && step === 5) return true;
    return false;
  };

  const showMatrix = step >= 2;       
  const showPayloadWindow = step >= 3; 
  const showWarningBox = step >= 4;    
  const showButton = step >= 7;        

  useEffect(() => {
    const sequence = [
      { t: 1000, step: 1 }, 
      { t: 2300, step: 2 }, 
      { t: 3300, step: 3 }, 
      { t: 5300, step: 4 }, 
      { t: 6300, step: 5 }, 
      { t: 8300, step: 6 }, 
      { t: 9300, step: 7 }, 
    ];

    const timeouts = sequence.map(({ t, step }) => {
      return setTimeout(() => {
        if (!isBreaching) setStep(step);
      }, t);
    });

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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0F0';
      ctx.font = '14px "Courier New"';

      ypos.forEach((y, ind) => {
        const charSet = Math.random() > 0.5 ? 0x16A0 : 0x2200; 
        const text = String.fromCharCode(charSet + Math.random() * 64);
        const x = ind * 20;
        ctx.fillText(text, x, y);
        const speed = isBreaching ? 100 : 20; 
        if (y > canvas.height + Math.random() * 10000) ypos[ind] = 0;
        else ypos[ind] = y + speed;
      });
    };
    const interval = setInterval(matrixEffect, 50);
    return () => clearInterval(interval);
  }, [showMatrix, isBreaching]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBreaching) handleInitialize();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBreaching]);

  const handleInitialize = () => {
    setIsBreaching(true);
    setStep(7);
    setTimeout(onComplete, 800); 
  };

  return (
    <motion.div 
      animate={{ backgroundColor: isBreaching ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-mono overflow-hidden"
    >
      
      <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 z-0 transition-opacity duration-300 ${showMatrix && !isBreaching ? 'opacity-30' : 'opacity-0'}`} 
      />

      <motion.div 
        className="relative z-10 flex flex-col gap-4 items-center w-full max-w-2xl px-4"
        animate={isBreaching ? { scale: 15, opacity: 0, filter: "blur(10px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ 
          scale: { duration: 0.8, ease: "easeIn" },
          opacity: { duration: 0.2, ease: "easeIn" },
          filter: { duration: 0.2 }
        }}
      >

        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-black/90 border border-elfy-green-dim/50 shadow-[0_0_20px_rgba(0,255,65,0.1)] overflow-hidden"
        >
          <BootHeader />
          <div className="p-4 pt-2 h-40 flex flex-col justify-start text-xs md:text-sm font-mono relative z-10 leading-relaxed">
            {logsToShow.map((line, i) => (
              <TypedLog 
                key={i} 
                text={line.text} 
                color={line.color} 
                speed={line.speed}
                showDots={getShowDots(i)}
              />
            ))}
            {!isBreaching && <div className="animate-pulse text-elfy-green font-bold text-lg mt-1">_</div>}
          </div>
        </motion.div>

        <AnimatePresence>
          {showPayloadWindow && (
            <motion.div 
              layout 
              initial={{ y: 50, opacity: 0, height: 0 }}
              animate={{ y: 0, opacity: 1, height: "auto" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="w-full bg-black/90 border border-elfy-green shadow-[0_0_40px_rgba(0,255,65,0.15)] overflow-hidden"
            >
              <CoreHeader />
              
              <div className="p-6 flex flex-col items-center gap-8">
                
                <pre className="text-[6px] md:text-[8px] leading-[6px] md:leading-[8px] font-mono text-elfy-green font-bold text-center whitespace-pre overflow-x-hidden select-none">
                  {ASCII_TITLE}
                </pre>

                {showWarningBox && (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      boxShadow: [
                        "0 0 10px rgba(255, 0, 60, 0.2)",    
                        "0 0 40px rgba(255, 0, 60, 0.6)",    
                        "0 0 10px rgba(255, 0, 60, 0.2)"
                      ]
                    }}
                    transition={{ 
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 },
                      boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="relative border border-elfy-red bg-elfy-red/10 w-fit mx-auto flex items-center justify-center gap-4 py-2 px-6 select-none"
                  >
                    <motion.span 
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-3xl text-elfy-red"
                    >
                      ⚠
                    </motion.span>

                    <span className="text-sm font-header font-black tracking-widest text-center text-elfy-red whitespace-nowrap pb-0.5">
                       UNSAFE CONNECTION DETECTED
                    </span>

                    <motion.span 
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-3xl text-elfy-red"
                    >
                      ⚠
                    </motion.span>
                  </motion.div>
                )}

                {showButton && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <button 
                      onClick={handleInitialize}
                      className="group relative px-8 py-2 overflow-hidden border border-elfy-green transition-all hover:shadow-[0_0_30px_rgba(0,255,65,0.6)]"
                    >
                      <div className="absolute inset-0 bg-elfy-green translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      {/* REDUCED SIZE + WHITESPACE NOWRAP */}
                      <span className="relative z-10 font-mono font-bold text-xl md:text-3xl text-elfy-green group-hover:text-black transition-colors block tracking-widest whitespace-nowrap">
                        [ INITIALIZE_SYSTEM.EXE ]
                      </span>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
};
