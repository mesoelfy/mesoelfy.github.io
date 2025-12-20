import { Volume2, VolumeX, Music, Activity, Wind, Settings, Infinity as InfinityIcon } from 'lucide-react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useHeartbeat } from '@/ui/sim/hooks/useHeartbeat';
import { useAudio } from '@/ui/hooks/useAudio';
import { getPan } from '@/engine/audio/AudioUtils';
import { ToggleButton } from '@/ui/kit/atoms/ToggleButton';
import { useGameStream, useStreamText } from '@/ui/hooks/useGameStream';

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
  
  // -- STREAM BINDINGS --
  const scoreRef = useRef<HTMLSpanElement>(null);
  const integrityRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [integrityState, setIntegrityState] = useState(100);

  useStreamText('SCORE', scoreRef, (v) => v.toString().padStart(4, '0'));
  
  useGameStream('SYSTEM_INTEGRITY', (val) => {
      if (barRef.current) barRef.current.style.width = `${val}%`;
      if (integrityRef.current) integrityRef.current.innerText = `OS_INTEGRITY: ${Math.floor(val)}%`;
      setIntegrityState(val);
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isCritical = integrityState < 30;
  const isWarning = integrityState < 60;
  const isGameOver = integrityState <= 0;
  
  // Unified Color Logic
  let statusColor = "text-primary-green";
  if (isZenMode) statusColor = "text-purple-300"; // Zen Mode = Purple
  else if (isCritical) statusColor = "text-critical-red";
  else if (isWarning) statusColor = "text-alert-yellow";

  const borderColor = isZenMode ? "border-purple-500/30" : "border-white/10";

  const heartbeatControls = useHeartbeat();

  return (
    <header className="relative w-full h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 border-b border-white/5 transition-colors duration-300">
      
      {/* Zen Gradient Overlay */}
      {isZenMode && (
          <motion.div 
            className="absolute inset-x-0 bottom-0 h-[2px] z-50 bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
            animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
      )}

      <div className="flex items-center gap-4">
        {/* ADDED KEY: Force Remount when switching to Zen Mode to kill Heartbeat Animation */}
        <motion.span 
            key={isZenMode ? "zen-logo" : "standard-logo"}
            animate={(!isZenMode && isCritical) ? heartbeatControls : "idle"} 
            variants={{ 
                idle: { scale: 1, textShadow: "0 0 0px transparent" },
                heartbeat: { 
                    scale: [1, 1.05, 1], 
                    textShadow: ["0 0 0px #FF003C", "0 0 25px #FF003C", "0 0 0px #FF003C"], 
                    transition: { duration: 0.8, times: [0, 0.04, 1], ease: "easeOut" } 
                } 
            }} 
            className={clsx("font-header font-black text-xl md:text-2xl tracking-wide transition-colors duration-500", statusColor)}
        >
          {isZenMode ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
                  ZEN_OS
              </span>
          ) : "MESOELFY_OS"}
        </motion.span>
        
        {mounted && (
          <div className={clsx("hidden md:flex items-center gap-4 text-xs font-mono pl-4 border-l transition-colors", statusColor, borderColor)}>
            <Radar active={isPlaying} panic={!isZenMode && (isCritical || (isPlaying && isCritical))} color={statusColor} />
            <div className="flex flex-col leading-none">
                <span className="text-[8px] opacity-60 tracking-wider">{isZenMode ? "PEACE_PROTOCOL" : "THREAT_NEUTRALIZED"}</span>
                <span ref={scoreRef} className="font-bold text-lg tabular-nums tracking-widest">0000</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className={clsx("flex items-center gap-1 pl-4 border-l transition-colors", borderColor)}>
            <ToggleButton variant="icon" active={audioSettings.ambience} onClick={toggleAmbience} color={statusColor} icon={Wind} />
            <ToggleButton variant="icon" active={audioSettings.sfx} onClick={toggleSfx} color={statusColor} icon={Music} label="SFX" />
            <ToggleButton variant="icon" active={audioSettings.music} onClick={toggleMusic} color={statusColor} icon={Music} />
            <div className={clsx("w-[1px] h-4 mx-1 transition-colors", isZenMode ? "bg-purple-500/30" : "bg-white/10")} />
            <ToggleButton variant="icon" active={audioSettings.master} onClick={toggleMaster} color={statusColor} icon={Volume2} iconOff={VolumeX} />
            <div className={clsx("w-[1px] h-4 mx-1 transition-colors", isZenMode ? "bg-purple-500/30" : "bg-white/10")} />
            <button onClick={(e) => { toggleSettings(); audio.playSound('ui_menu_open', getPan(e)); }} className={clsx("flex items-center justify-center p-1.5 transition-all duration-200 border border-transparent rounded-sm hover:text-white hover:bg-white/5", statusColor)}>
                <Settings size={14} className="animate-spin-slow" />
            </button>
        </div>
      </div>
      
      {!isGameOver && !isZenMode && (
        <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900">
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
        </div>
      )}
      
      <div className={clsx("absolute bottom-[-14px] right-2 text-[8px] font-mono flex items-center gap-1 transition-colors duration-300", isZenMode ? "text-purple-400" : (isCritical ? "text-critical-red" : isWarning ? "text-alert-yellow" : "text-primary-green-dim"))}>
        {isZenMode ? <InfinityIcon size={10} /> : <Activity size={8} className={isCritical ? "animate-pulse" : ""} />}
        <span ref={integrityRef}>{isZenMode ? "STATE: ETERNAL" : "OS_INTEGRITY: 100%"}</span>
      </div>
    </header>
  );
};
