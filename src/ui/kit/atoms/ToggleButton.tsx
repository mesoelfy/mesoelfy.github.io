import { clsx } from 'clsx';
import { useAudio } from '@/ui/hooks/useAudio';
import { getPan } from '@/engine/audio/AudioUtils';

interface ToggleButtonProps {
  label?: string;
  icon: any;
  iconOff?: any;
  active: boolean;
  onClick: () => void;
  variant?: 'icon' | 'panel'; // icon = Header style, panel = SoundTab style
  color?: string; // Optional text color override
}

export const ToggleButton = ({ 
  label, 
  icon: IconOn, 
  iconOff: IconOff, 
  active, 
  onClick, 
  variant = 'icon',
  color
}: ToggleButtonProps) => {
  const audio = useAudio();
  const Icon = active ? IconOn : (IconOff || IconOn);

  const handleClick = (e: React.MouseEvent) => {
      onClick();
      audio.playClick(getPan(e));
  };

  if (variant === 'panel') {
      return (
        <button
          onClick={handleClick}
          onMouseEnter={(e) => audio.playHover(getPan(e))}
          className={clsx(
            "flex flex-col items-center justify-center p-2 border transition-all duration-200 w-full h-14 relative overflow-hidden group",
            active 
              ? "bg-primary-green/10 border-primary-green text-primary-green shadow-[inset_0_0_10px_rgba(120,246,84,0.1)]" 
              : "bg-black/40 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
          )}
        >
          {active && (
             <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary-green shadow-[0_0_5px_#78F654]" />
          )}
          <Icon 
            size={16} 
            strokeWidth={1.5}
            className={clsx("mb-1 transition-transform", active ? "scale-110" : "opacity-50")} 
          />
          {label && <span className="text-[9px] font-bold font-mono tracking-widest">{label}</span>}
        </button>
      );
  }

  // Variant 'icon' (Header)
  return (
    <button 
      onClick={handleClick}
      onMouseEnter={(e) => audio.playHover(getPan(e))}
      className={clsx(
        "flex items-center justify-center w-8 h-7 transition-all duration-200 border rounded-sm",
        active 
          ? `hover:text-alert-yellow bg-white/5 border-white/20 ${color || ''}`
          : `${color || ''} border-transparent opacity-40 hover:text-critical-red hover:opacity-100`
      )}
    >
      <div className={clsx(active ? "" : "opacity-50")}>
          {label ? <span className="text-[10px] font-mono font-bold tracking-tighter decoration-1 underline-offset-2">{label}</span> : <Icon size={14} />}
      </div>
    </button>
  );
};
