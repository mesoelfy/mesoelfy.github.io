import { useGameStore } from '@/engine/state/game/useGameStore';
import { clsx } from 'clsx';
import { Activity, Signal, Zap } from 'lucide-react';

export const MobileHeader = () => {
  const integrity = useGameStore(s => s.systemIntegrity);
  const score = useGameStore(s => s.score);
  
  const isCritical = integrity < 30;
  
  return (
    <div className="absolute top-0 left-0 w-full h-14 flex items-center justify-between px-4 z-[90] pointer-events-none select-none bg-gradient-to-b from-black/90 to-transparent">
      {/* Integrity */}
      <div className={clsx("flex items-center gap-2 font-mono text-xs font-bold", isCritical ? "text-critical-red animate-pulse" : "text-primary-green")}>
        <Activity size={16} />
        <div className="flex flex-col leading-none">
            <span>SYS_INT</span>
            <span className="text-lg">{Math.floor(integrity)}%</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end font-header font-black tracking-widest text-service-cyan drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
        <span className="text-[10px] opacity-60">SCORE</span>
        <span className="text-lg leading-none">{score.toString().padStart(6, '0')}</span>
      </div>
    </div>
  );
};
