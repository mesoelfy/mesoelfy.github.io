import { clsx } from 'clsx';
import { useAudio } from '@/ui/hooks/useAudio';
import { getPan } from '@/engine/audio/AudioUtils';

interface ToggleButtonProps {
  label?: string;
  icon: any;
  iconOff?: any;
  active: boolean;
  onClick: () => void;
  variant?: 'icon' | 'panel'; 
  color?: string; // e.g. "text-primary-green"
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

  // 1. PANEL VARIANT (Settings Menu) - Unchanged
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

  // 2. ICON VARIANT (Header) - Updated with Invert Logic
  return (
    <button 
      onClick={handleClick}
      onMouseEnter={(e) => audio.playHover(getPan(e))}
      className={clsx(
        "group flex items-center justify-center w-8 h-7 transition-all duration-200 border rounded-sm",
        // Base Dynamic Color (e.g. text-primary-green, text-critical-red)
        color || 'text-white',
        // Hover: Background becomes the text color
        "hover:bg-current hover:border-transparent",
        active 
          ? "bg-white/5 border-white/20 opacity-100"
          : "border-transparent opacity-40 hover:opacity-100"
      )}
    >
      <div className={clsx(
          "flex items-center justify-center transition-colors duration-200",
          // Default: Inherit color. Hover: Force BLACK to contrast against the colored background
          "text-current group-hover:text-black",
          active ? "" : "opacity-80"
      )}>
          {label ? (
            <span className="text-[10px] font-mono font-bold tracking-tighter decoration-1 underline-offset-2">
                {label}
            </span> 
          ) : (
            <Icon size={14} />
          )}
      </div>
    </button>
  );
};
