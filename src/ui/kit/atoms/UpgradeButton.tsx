import { clsx } from 'clsx';
import { ChevronUp, Lock, Check } from 'lucide-react';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { getPan } from '@/engine/audio/AudioUtils';
import { memo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  path: any; 
  disabled: boolean;
  canAfford: boolean;
  onUpgrade: (path: any, e: React.MouseEvent) => void;
  onHoverCost: (cost: number | null) => void;
  colorClass?: string; // e.g. "bg-primary-green"
  heightClass?: string;
}

export const UpgradeButton = memo(({ 
  path, 
  disabled, 
  canAfford, 
  onUpgrade, 
  onHoverCost, 
  colorClass = "bg-primary-green",
  heightClass = "h-12"
}: Props) => {
  
  // Extract just the color name for text classes (e.g. "text-primary-green")
  const textClass = colorClass.replace('bg-', 'text-');
  const borderClass = colorClass.replace('bg-', 'border-');

  return (
      <button 
          onClick={(e) => {
              if (!disabled && canAfford) onUpgrade(path, e);
              else if (!canAfford && !disabled) AudioSystem.playSound('ui_error');
          }}
          onMouseEnter={() => {
              if (!disabled) {
                  onHoverCost(1);
                  if (canAfford) AudioSystem.playHover();
              }
          }}
          onMouseLeave={() => onHoverCost(null)}
          disabled={disabled}
          className={clsx(
              "group/btn relative w-8 flex flex-col items-center justify-center border-r transition-all duration-300 overflow-hidden shrink-0",
              heightClass,
              disabled 
                  ? "border-white/5 cursor-default bg-white/5" 
                  : canAfford 
                      ? clsx("cursor-pointer border-white/10 hover:text-black", `hover:${colorClass}`) 
                      : "cursor-not-allowed border-critical-red/30 bg-critical-red/5 text-critical-red/50"
          )}
      >
          {/* Background Slide Effect */}
          {!disabled && canAfford && (
              <div className={clsx(
                  "absolute inset-0 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-200 ease-out",
                  colorClass
              )} />
          )}

          {/* Icon Layer */}
          <div className="relative z-10">
              {disabled ? (
                  <Check size={14} className={textClass} />
              ) : !canAfford ? (
                  <Lock size={12} />
              ) : (
                  <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
                  >
                      <ChevronUp size={18} strokeWidth={3} className={clsx("transition-colors duration-200", `group-hover/btn:text-black`, textClass)} />
                  </motion.div>
              )}
          </div>

          {/* Scanline Overlay (Aesthetic) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
      </button>
  );
});

UpgradeButton.displayName = 'UpgradeButton';
