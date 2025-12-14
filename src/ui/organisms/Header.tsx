import { Volume2, VolumeX, Music, Activity, Wind, Settings } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useHeartbeat } from '@/game/hooks/useHeartbeat';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { getPan } from '@/core/audio/AudioUtils';
import { useAudioVisualizer } from '@/core/audio/hooks/useAudioVisualizer';

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

const ToggleBtn = ({ active, onClick, children, color }: any) => (
  <button 
    onClick={(e) => { onClick(); AudioSystem.playClick(getPan(e)); }}
    onMouseEnter={(e) => AudioSystem.playHover(getPan(e))}
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
  
  // AUDIO VISUALIZER HOOK
  const audioData = useAudioVisualizer(32); // 32 bins
  const logoRef = useRef<HTMLSpanElement>(null);

  // VISUALIZER LOOP
  useEffect(() => {
      const loop = () => {
          if (logoRef.current) {
              // Calculate average volume from low-mids (bins 0-8)
              let sum = 0;
              for(let i=0; i<8; i++) sum += audioData.current[i];
              const avg = sum / 8;
              
              // Map 0-255 to 1.0 - 1.15 scale
              const scale = 1.0 + (avg / 255) * 0.15;
              const brightness = 1.0 + (avg / 255) * 0.5;
              
              logoRef.current.style.transform = `scale(${scale})`;
              logoRef.current.style.filter = `brightness(${brightness})`;
          }
          requestAnimationFrame(loop);
      };
      const frameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameId);
  }, []);

  const textVariants = {
      heartbeat: {
          textShadow: [
              "0 0 0px #FF003C",
              "0 0 25px #FF003C", 
              "0 0 0px #FF003C"
          ],
          transition: { duration: 0.8, times: [0, 0.04, 1], ease: "easeOut" }
      }
  };

  return (
    <header className="relative w-full h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 border-b border-white/5 transition-colors duration-300">
      
      {/* LEFT: Identity */}
      <div className="flex items-center gap-4">
        <motion.span 
            ref={logoRef} // ATTACH REF
            animate={isCritical ? heartbeatControls : undefined}
            variants={textVariants}
            className={clsx(
                "font-header font-black text-xl md:text-2xl tracking-wide transition-colors duration-100 will-change-transform",
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

            <button 
                onClick={(e) => { toggleSettings(); AudioSystem.playSound('ui_menu_open', getPan(e)); }}
                className={clsx(
                  "flex items-center justify-center p-1.5 transition-all duration-200 border border-transparent rounded-sm hover:text-alert-yellow hover:bg-white/5",
                  statusColor
                )}
            >
                <Settings size={14} className="animate-spin-slow" />
            </button>

        </div>
      </div>

      {!isGameOver && (
        <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-gray-900">
          <motion.div
            className="h-full"
            initial={{ width: "100%" }}
            animate={{ width: `${systemIntegrity}%` }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
          >
              <div className={clsx("w-full h-full shadow-[0_0_10px_currentColor]", 
                    isCritical ? "bg-critical-red" : isWarning ? "bg-alert-yellow" : "bg-primary-green"
              )} />
          </motion.div>
        </div>
      )}
      
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
