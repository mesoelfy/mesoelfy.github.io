import { Volume2, VolumeX, Music, Activity } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// --- SUB-COMPONENTS ---

const Radar = ({ active, panic, color }: { active: boolean, panic: boolean, color: string }) => (
  <div className={`relative w-8 h-8 rounded-full border border-current flex items-center justify-center overflow-hidden bg-black/50 ${color}`}>
    <div className="absolute inset-0 border-current opacity-20" 
         style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
    <div className="absolute w-full h-[1px] bg-current opacity-40" />
    <div className="absolute h-full w-[1px] bg-current opacity-40" />
    
    <motion.div 
      className="absolute inset-0 origin-bottom-right opacity-40"
      style={{ 
        background: 'conic-gradient(from 0deg, transparent 270deg, currentColor 360deg)',
      }}
      animate={{ rotate: 360 }}
      transition={{ 
        repeat: Infinity, 
        ease: "linear", 
        duration: panic ? 1.0 : 4.0 
      }}
    />
    <div className={`w-1 h-1 rounded-full bg-current ${active ? 'animate-pulse' : ''}`} />
  </div>
);

const SfxBtn = ({ active, onClick, color }: { active: boolean, onClick: () => void, color: string }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center justify-center px-1.5 py-1 transition-all duration-200 border border-transparent rounded-sm font-mono text-[10px] font-bold tracking-tighter",
      active 
        ? `hover:text-elfy-yellow bg-white/5 border-white/10 ${color}`
        : `${color} opacity-40 hover:text-elfy-red hover:opacity-100 decoration-line-through`
    )}
  >
    SFX
  </button>
);

const AudioBtn = ({ active, onClick, icon: Icon, offIcon: OffIcon, color }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center justify-center p-1.5 transition-all duration-200 border border-transparent rounded-sm",
      active 
        ? `hover:text-elfy-yellow bg-white/5 ${color}`
        : `${color} opacity-40 hover:text-elfy-red hover:opacity-100`
    )}
  >
    {active ? <Icon size={14} /> : <OffIcon size={14} />}
  </button>
);

export const Header = () => {
  const { audioSettings, toggleMaster, toggleMusic, toggleSfx } = useStore();
  
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const score = useGameStore(state => state.score);
  const isPlaying = useGameStore(state => state.isPlaying);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isCritical = systemIntegrity < 30;
  const isWarning = systemIntegrity < 60;
  
  let statusColor = "text-elfy-green";
  if (isCritical) statusColor = "text-elfy-red";
  else if (isWarning) statusColor = "text-elfy-yellow";

  return (
    <header className="relative w-full h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0 border-b border-white/5">
      
      {/* LEFT: Identity */}
      <div className="flex items-center gap-4">
        <span className={clsx(
            "font-header font-black text-xl md:text-2xl tracking-wide transition-colors duration-500",
            statusColor
        )}>
          MESOELFY_OS
        </span>
        
        {mounted && (
          <div className={`hidden md:flex items-center gap-4 text-xs font-mono border-l border-white/10 pl-4 ${statusColor}`}>
            <Radar active={isPlaying} panic={isCritical || (isPlaying && score > 0)} color={statusColor} />
            
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
        
        {/* Audio Group - Passes statusColor to turn buttons Red/Yellow */}
        <div className="flex items-center gap-1 border-l border-white/10 pl-4">
            <SfxBtn active={audioSettings.sfx} onClick={toggleSfx} color={statusColor} />
            
            <AudioBtn 
                active={audioSettings.music} 
                onClick={toggleMusic} 
                icon={Music} 
                offIcon={Music}
                color={statusColor}
            />

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            <AudioBtn 
                active={audioSettings.master} 
                onClick={toggleMaster} 
                icon={Volume2} 
                offIcon={VolumeX} 
                color={statusColor}
            />
        </div>
      </div>

      {/* BOTTOM BORDER */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900">
        <div 
          className={clsx("h-full transition-all duration-500 ease-out shadow-[0_0_10px_currentColor]", 
              isCritical ? "bg-elfy-red" : isWarning ? "bg-elfy-yellow" : "bg-elfy-green"
          )} 
          style={{ width: `${systemIntegrity}%` }}
        />
      </div>
      
      {/* Integrity Text changes color at 60% */}
      <div className={clsx(
          "absolute bottom-[-14px] right-2 text-[8px] font-mono flex items-center gap-1 transition-colors duration-300",
          isCritical ? "text-elfy-red" : isWarning ? "text-elfy-yellow" : "text-elfy-green-dim"
      )}>
        <Activity size={8} className={isCritical ? "animate-pulse" : ""} />
        <span>OS_INTEGRITY: {Math.floor(systemIntegrity)}%</span>
      </div>

    </header>
  );
};
