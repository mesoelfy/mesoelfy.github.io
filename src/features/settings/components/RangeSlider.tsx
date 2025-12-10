import { clsx } from 'clsx';
import { AudioSystem } from '@/core/audio/AudioSystem';

interface RangeSliderProps {
  label: string;
  value: number; 
  onChange: (val: number) => void;
  max?: number; 
  displayMax?: number; 
  format?: (val: number) => string;
  markerValue?: number; 
}

export const RangeSlider = ({ 
  label, 
  value, 
  onChange, 
  max = 3.0,
  displayMax = 300,
  markerValue = 1.0,
  format
}: RangeSliderProps) => {
  
  const currentPercent = (value / max) * 100;
  const uiValue = value * (displayMax / max);
  const markerPercent = (markerValue / max) * 100;

  let trackColor = "bg-primary-green";
  let glowColor = "shadow-[0_0_10px_#78F654]";
  
  if (value > 2.0) {
      trackColor = "bg-critical-red";
      glowColor = "shadow-[0_0_15px_#FF003C]";
  } else if (value > 1.0) {
      trackColor = "bg-alert-yellow";
      glowColor = "shadow-[0_0_10px_#eae747]";
  }

  const displayString = format ? format(value) : `${Math.round(uiValue)}%`;

  return (
    <div 
        className="flex flex-col gap-1.5 w-full group"
        onMouseEnter={() => AudioSystem.playHover()}
    >
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold font-mono tracking-wider opacity-80 text-gray-400 group-hover:text-white transition-colors">{label}</span>
        <span className={clsx("text-xs font-mono font-bold transition-colors", 
            value > 2.0 ? "text-critical-red animate-pulse" : 
            value > 1.0 ? "text-alert-yellow" : "text-primary-green"
        )}>
            {displayString}
        </span>
      </div>
      
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/10">
             <div 
                className={clsx("h-full transition-all duration-75 ease-out", trackColor, glowColor)} 
                style={{ width: `${currentPercent}%` }}
             />
        </div>

        <div 
            className="absolute top-0 bottom-0 w-[2px] bg-white/20 z-0 pointer-events-none group-hover:bg-white/50 transition-colors" 
            style={{ left: `${markerPercent}%` }}
        >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/50 rounded-full" />
        </div>
        
        <input 
          type="range"
          min="0" 
          max={displayMax} 
          step="1"
          value={uiValue}
          onChange={(e) => {
              const raw = parseFloat(e.target.value);
              const logicVal = (raw / displayMax) * max;
              onChange(logicVal);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          data-interactive="true"
        />
        
        <div 
            className="absolute h-3 w-1 bg-white z-10 pointer-events-none shadow-sm"
            style={{ left: `calc(${currentPercent}% - 2px)` }}
        />
      </div>
    </div>
  );
};
