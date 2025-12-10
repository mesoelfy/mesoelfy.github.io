import { Volume2, VolumeX, Music, Activity, Wind, Settings } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useHeartbeat } from '@/game/hooks/useHeartbeat';
import { AudioSystem } from '@/core/audio/AudioSystem';

const Radar = ({ active, panic, color }: { active: boolean, panic: boolean, color: string }) => (
  <div className={`relative w-8 h-8 rounded-full border border-current flex items-center justify-center overflow-hidden bg-black/50 ${color}`}>
    <div className="absolute inset-0 border-current opacity-20" 
         style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
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

// Standardized Button Component for Uniformity
const ToggleBtn = ({ active, onClick, children, color }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center justify-center w-8 h-7 transition-all duration-200 border rounded-sm",
      active 
        ? `hover:text-alert-yellow bg-white/5 border-white/20 ${color}`
        : `${color} border-transparent opacity-40 hover:text-critical-red hover:opacity-100`
    )}
  >
    {children}
  </button>
);

export const Header = () => {
  const { audioSettings, toggleMaster, toggleMusic, toggleSfx, toggleAmbience, toggleSettings } = useStore();
  
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const isPlaying = useGameStore(state => state.isPlaying);
  const score = useGameStore(state => state.score);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isCritical = systemIntegrity < 30;
  const isWarning = systemIntegrity < 60;
  const isGameOver = systemIntegrity <= 0;
  
  let statusColor = "text-primary-green";
  if (isCritical) statusColor = "text-critical-red";
  else if (isWarning) statusColor = "text-alert-yellow";

  const heartbeatControls = useHeartbeat();

  const textVariants = {
      heartbeat: {
          scale: [1, 1.05, 1],
          textShadow: [
              "0 0 0px #FF003C",
              "0 0 25px #FF003C", 
              "0 0 0px #FF003C"
          ],
          transition: { 
              duration: 0.8, 
              times: [0, 0.04, 1], 
              ease: "easeOut" 
          }
      }
  };

  const barVariants = {
      heartbeat: {
          filter: [
              "brightness(1) drop-shadow(0 0 0px #FF003C)",
              "brightness(2) drop-shadow(0 0 10px #FF003C)",
              "brightness(1) drop-shadow(0 0 0px #FF003C"
          ],
          transition: { 
              duration: 0.8, 
              times: [0, 0.04, 1], 
              ease: "easeOut" 
          }
      }
  };

  return (
    <header className="relative w-full h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 border-b border-white/5 transition-colors duration-300">
      
      {/* LEFT: Identity */}
      <div className="flex items-center gap-4">
        <motion.span 
            animate={isCritical ? heartbeatControls : undefined}
            variants={textVariants}
            className={clsx(
                "font-header font-black text-xl md:text-2xl tracking-wide transition-colors duration-500",
                statusColor
            )}
        >
          MESOELFY_OS
        </motion.span>
        
        {mounted && (
          <div className={`hidden md:flex items-center gap-4 text-xs font-mono border-l border-white/10 pl-4 ${statusColor}`}>
            <Radar active={isPlaying} panic={isCritical || (isPlaying && isCritical)} color={statusColor} />
            <div className="flex flex-col leading-none">
                <span className="text-[8px] opacity-60 tracking-wider">THREAT_NEUTRALIZED</span>
                <span className="font-bold text-lg tabular-nums tracking-widest">
                    {score.toString().padStart(4, '0')}
                </span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Status & Audio Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 border-l border-white/10 pl-4">
            
            {/* Audio Toggles */}
            <ToggleBtn active={audioSettings.ambience} onClick={toggleAmbience} color={statusColor}>
                <Wind size={14} />
            </ToggleBtn>
            
            <ToggleBtn active={audioSettings.sfx} onClick={toggleSfx} color={statusColor}>
                <span className="text-[10px] font-mono font-bold tracking-tighter decoration-1 underline-offset-2">SFX</span>
            </ToggleBtn>
            
            <ToggleBtn active={audioSettings.music} onClick={toggleMusic} color={statusColor}>
                {audioSettings.music ? <Music size={14} /> : <Music size={14} className="opacity-50" />}
            </ToggleBtn>
            
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            
            <ToggleBtn active={audioSettings.master} onClick={toggleMaster} color={statusColor}>
                {audioSettings.master ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </ToggleBtn>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            {/* Settings Button (Right Most) */}
            <button 
                onClick={() => { toggleSettings(); AudioSystem.playSound('menu_open'); }}
                className={clsx(
                  "flex items-center justify-center p-1.5 transition-all duration-200 border border-transparent rounded-sm hover:text-alert-yellow hover:bg-white/5",
                  statusColor
                )}
            >
                <Settings size={14} className="animate-spin-slow" />
            </button>

        </div>
      </div>

      {/* BOTTOM BORDER / HEALTH BAR */}
      {!isGameOver && (
        <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900">
          <motion.div 
            animate={isCritical ? heartbeatControls : undefined}
            variants={barVariants}
            className={clsx("h-full transition-all duration-500 ease-out shadow-[0_0_10px_currentColor]", 
                isCritical ? "bg-critical-red" : isWarning ? "bg-alert-yellow" : "bg-primary-green"
            )} 
            style={{ width: `${systemIntegrity}%` }}
          />
        </div>
      )}
      
      {/* INTEGRITY TEXT */}
      <div className={clsx(
          "absolute bottom-[-14px] right-2 text-[8px] font-mono flex items-center gap-1 transition-colors duration-300",
          isCritical ? "text-critical-red" : isWarning ? "text-alert-yellow" : "text-primary-green-dim"
      )}>
        <Activity size={8} className={isCritical ? "animate-pulse" : ""} />
        <span>OS_INTEGRITY: {Math.floor(systemIntegrity)}%</span>
      </div>

    </header>
  );
};
