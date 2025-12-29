import { Volume2, VolumeX, Music, Activity, Wind, Settings, Infinity as InfinityIcon, FastForward } from 'lucide-react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeartbeat } from '@/ui/sim/hooks/useHeartbeat';
import { useAudio } from '@/ui/hooks/useAudio';
import { getPan } from '@/engine/audio/AudioUtils';
import { ToggleButton } from '@/ui/kit/atoms/ToggleButton';
import { useGameStream } from '@/ui/hooks/useGameStream';

// --- ASSETS ---
const LOGO_COMBINATION = "/assets/ui/logo_combination.svg";
const LOGO_MARK = "/assets/ui/logo_mark.svg";

// --- HELPER: CSS MASK COMPONENT (AUTO-SIZING) ---
// Uses an invisible img to set layout bounds, then overlays a colored mask.
const MaskedLogo = ({ src, className }: { src: string, className?: string }) => (
    <div className="relative inline-flex items-center justify-center">
        {/* Layout Spacer: Sets width/height based on aspect ratio */}
        <img 
            src={src} 
            alt="" 
            className={clsx("opacity-0 select-none pointer-events-none relative z-0", className)} 
            aria-hidden="true" 
        />
        
        {/* Visual Layer: Takes the text color (bg-current) */}
        <div 
            className="absolute inset-0 bg-current z-10" 
            style={{ 
                maskImage: `url('${src}')`, 
                WebkitMaskImage: `url('${src}')`,
                maskSize: 'contain', 
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat', 
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center'
            }} 
        />
    </div>
);

const Radar = ({ active, panic, color }: { active: boolean, panic: boolean, color: string }) => (
  <div className={`relative w-8 h-8 rounded-full border border-current flex items-center justify-center overflow-hidden bg-black/50 ${color}`}>
    <div className="absolute inset-0 border-current opacity-20" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
    <div className="absolute w-full h-[1px] bg-current opacity-40" />
    <div className="absolute h-full w-[1px] bg-current opacity-40" />
    <motion.div 
      className="absolute inset-0 origin-bottom-right opacity-40"
      style={{ background: 'conic-gradient(from 0deg, transparent 270deg, currentColor 360deg)' }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: panic ? 1.0 : 4.0 }}
    />
    <div className={`w-1 h-1 rounded-full bg-current ${active ? 'animate-pulse' : ''}`} />
  </div>
);

const barVariants = {
  idle: { filter: "none", transition: { duration: 0.2 } },
  heartbeat: {
    filter: [
      "brightness(1) drop-shadow(0 0 0px #FF003C)", 
      "brightness(2) drop-shadow(0 0 10px #FF003C)", 
      "brightness(1) drop-shadow(0 0 0px #FF003C)"
    ],
    transition: { duration: 0.8, times: [0, 0.04, 1], ease: "easeOut" }
  }
};

export const Header = () => {
  const { audioSettings, toggleMaster, toggleMusic, toggleSfx, toggleAmbience, toggleSettings } = useStore();
  const audio = useAudio();
  const isPlaying = useGameStore(state => state.isPlaying);
  const isZenMode = useGameStore(state => state.isZenMode);
  
  const scoreRef = useRef<HTMLSpanElement>(null);
  const integrityRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [integrityState, setIntegrityState] = useState(100);

  // --- REFACTOR: DIRECT DOM UPDATE (No Service Locator dependency) ---
  useGameStream('SCORE', (v) => {
      if (scoreRef.current) {
          scoreRef.current.innerText = Math.floor(v).toString().padStart(4, '0');
      }
  });
  
  useGameStream('SYSTEM_INTEGRITY', (val) => {
      if (barRef.current) barRef.current.style.width = `${val}%`;
      setIntegrityState(val);
      
      // Only update text dynamically if NOT in Zen Mode
      // In Zen Mode, we force the static 420% value via JSX below
      if (!isZenMode && integrityRef.current) {
          integrityRef.current.innerText = `OS_INTEGRITY: ${Math.floor(val)}%`;
      }
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isCritical = integrityState < 30;
  const isWarning = integrityState < 60;
  const isGameOver = integrityState <= 0;
  
  let statusColor = "text-primary-green";
  if (isZenMode) statusColor = "text-purple-300"; 
  else if (isCritical) statusColor = "text-critical-red";
  else if (isWarning) statusColor = "text-alert-yellow";

  const borderColor = isZenMode ? "border-purple-500/30" : "border-white/10";
  const heartbeatControls = useHeartbeat();

  // Slow down color transitions for Zen Mode feel (Structural elements only)
  const slowTransition = "transition-colors duration-[2000ms]";

  return (
    <header className={clsx("relative w-full h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 border-b border-white/5", slowTransition)}>
      
      {/* PRISMATIC ZEN BAR (Fades In) */}
      <AnimatePresence>
        {isZenMode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              className="absolute inset-x-0 bottom-0 h-[2px] z-50 overflow-hidden"
            >
                <motion.div 
                    className="w-full h-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                    animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <motion.div 
            key={isZenMode ? "zen-logo" : "standard-logo"}
            animate={(!isZenMode && isCritical) ? heartbeatControls : "idle"} 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            variants={{ 
                idle: { scale: 1, filter: "drop-shadow(0 0 0px transparent)" },
                heartbeat: { 
                    scale: [1, 1.05, 1], 
                    filter: ["drop-shadow(0 0 0px #FF003C)", "drop-shadow(0 0 15px #FF003C)", "drop-shadow(0 0 0px #FF003C)"], 
                    transition: { duration: 0.8, times: [0, 0.04, 1], ease: "easeOut" } 
                } 
            }} 
            className={clsx("flex items-center", slowTransition, statusColor)}
        >
          {isZenMode ? (
              <div className="flex items-center gap-3">
                  {/* Icon uses parent statusColor via bg-current */}
                  <MaskedLogo src={LOGO_MARK} className="h-8 w-auto" />
                  
                  {/* Text uses custom prismatic gradient matching the bar */}
                  <motion.span 
                      className="font-header font-black text-xl md:text-2xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                      animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  >
                      ZEN_OS
                  </motion.span>
              </div>
          ) : (
              <MaskedLogo 
                  src={LOGO_COMBINATION} 
                  className="h-8 w-auto mb-1" 
              />
          )}
        </motion.div>
        
        {mounted && (
          <div className={clsx("hidden md:flex items-center gap-4 text-xs font-mono pl-4 border-l", slowTransition, statusColor, borderColor)}>
            <Radar active={isPlaying} panic={!isZenMode && (isCritical || (isPlaying && isCritical))} color={statusColor} />
            <div className="flex flex-col leading-none">
                <span className="text-[8px] opacity-60 tracking-wider">{isZenMode ? "PEACE_PROTOCOL" : "THREAT_NEUTRALIZED"}</span>
                <span ref={scoreRef} className="font-bold text-lg tabular-nums tracking-widest">0000</span>
            </div>
          </div>
        )}
      </div>
      
      {/* CONTROLS */}
      <div className="flex items-center gap-0">
      
        {/* NEXT TRACK BUTTON (Fast Interaction) */}
        <button 
            onClick={(e) => { 
                audio.nextTrack(); 
                audio.playClick(getPan(e)); 
            }}
            onMouseEnter={(e) => audio.playHover(getPan(e))}
            className={clsx(
                "group flex items-center justify-center px-3 h-7 rounded-full border mr-3.5",
                // FAST transition for hover states
                "transition-all duration-200", 
                statusColor,
                "bg-white/5 border-white/20 opacity-100",
                "hover:bg-current hover:border-transparent"
            )}
            title="Next Track / Shuffle"
        >
            <FastForward 
              size={14} 
              className="fill-transparent group-hover:fill-current group-hover:text-black transition-all duration-200" 
              strokeWidth={2}
            />
        </button>

        {/* TOGGLE GROUP (Container is slow, Buttons are fast) */}
        <div className={clsx("flex items-center gap-1 pl-4 border-l", slowTransition, borderColor)}>
            <ToggleButton variant="icon" active={audioSettings.ambience} onClick={toggleAmbience} color={statusColor} icon={Wind} />
            <ToggleButton variant="icon" active={audioSettings.sfx} onClick={toggleSfx} color={statusColor} icon={Music} label="SFX" />
            <ToggleButton variant="icon" active={audioSettings.music} onClick={toggleMusic} color={statusColor} icon={Music} />
            
            <div className={clsx("w-[1px] h-4 mx-1", slowTransition, isZenMode ? "bg-purple-500/30" : "bg-white/10")} />
            
            <ToggleButton variant="icon" active={audioSettings.master} onClick={toggleMaster} color={statusColor} icon={Volume2} iconOff={VolumeX} />
            
            <div className={clsx("w-[1px] h-4 mx-1", slowTransition, isZenMode ? "bg-purple-500/30" : "bg-white/10")} />
            
            <button 
                onClick={(e) => { toggleSettings(); audio.playSound('ui_menu_open', getPan(e)); }} 
                className={clsx(
                    "group flex items-center justify-center p-1.5 border border-transparent rounded-sm",
                    "transition-all duration-200", // Fast hover
                    statusColor,
                    "hover:bg-current hover:border-transparent"
                )}
            >
                <Settings size={17} className="animate-spin-slow text-current group-hover:text-black transition-colors duration-200" />
            </button>
        </div>
      </div>
      
      {/* STANDARD HEALTH BAR (Fades Out) */}
      <AnimatePresence>
        {!isGameOver && !isZenMode && (
            <motion.div 
                key="standard-health-bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0 }}
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900"
            >
            <div ref={barRef} className="h-full w-full transition-all duration-100 ease-linear">
                <motion.div 
                    key={isCritical ? "critical-bar" : "normal-bar"}
                    animate={isCritical ? heartbeatControls : "idle"} 
                    variants={barVariants}
                    className={clsx(
                        "w-full h-full shadow-[0_0_10px_currentColor]", 
                        isCritical ? "bg-critical-red" : isWarning ? "bg-alert-yellow" : "bg-primary-green"
                    )} 
                />
            </div>
            </motion.div>
        )}
      </AnimatePresence>
      
      <div className={clsx("absolute bottom-[-14px] right-2 text-[8px] font-mono flex items-center gap-1", slowTransition, isZenMode ? "text-purple-400" : (isCritical ? "text-critical-red" : isWarning ? "text-alert-yellow" : "text-primary-green-dim"))}>
        {isZenMode ? <InfinityIcon size={10} /> : <Activity size={8} className={isCritical ? "animate-pulse" : ""} />}
        <span ref={integrityRef}>{isZenMode ? "OS_INTEGRITY: 420%" : "OS_INTEGRITY: 100%"}</span>
      </div>
    </header>
  );
};
