import { clsx } from 'clsx';
import { motion } from 'framer-motion';

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

export const HeaderRadar = ({ isZenMode, isCritical, isPlaying, statusColor, borderColor, slowTransition, scoreRef }: any) => {
    return (
        <div className={clsx("hidden md:flex items-center gap-4 text-xs font-mono pl-4 border-l", slowTransition, statusColor, borderColor)}>
            <Radar active={isPlaying} panic={!isZenMode && (isCritical || (isPlaying && isCritical))} color={statusColor} />
            <div className="flex flex-col leading-none">
                <span className="text-[8px] opacity-60 tracking-wider">{isZenMode ? "PEACE_PROTOCOL" : "THREAT_NEUTRALIZED"}</span>
                <span ref={scoreRef} className="font-bold text-lg tabular-nums tracking-widest">0000</span>
            </div>
        </div>
    );
};
