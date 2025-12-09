import { clsx } from 'clsx';

interface RangeSliderProps {
  label: string;
  value: number; 
  onChange: (val: number) => void;
  color?: string;
  max?: number; // Max logic value (e.g. 2.0 or 4.0)
  format?: (val: number) => string; // Custom display formatter
}

export const RangeSlider = ({ 
  label, 
  value, 
  onChange, 
  color = "accent-primary-green",
  max = 2.0,
  format
}: RangeSliderProps) => {
  
  // Calculate display value (percent of max)
  // Input max 200 means actual value 2.0
  const sliderMax = max * 100;
  const currentVal = value * 100;
  
  const displayString = format ? format(value) : `${Math.round(currentVal)}%`;
  
  // Center is 1.0 (100%) typically
  // Left: 50%
  // Right: 50%
  const centerPercent = (1.0 / max) * 100;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-bold font-mono tracking-wider opacity-80">{label}</span>
        <span className="text-xs font-mono font-bold text-white">{displayString}</span>
      </div>
      
      <div className="relative h-4 flex items-center">
        {/* Center Marker (1.0 Value) */}
        <div 
            className="absolute top-0 bottom-0 w-[1px] bg-white/30 z-0" 
            style={{ left: `${centerPercent}%` }}
        />
        
        <input 
          type="range"
          min="0" max={sliderMax} step="1"
          value={currentVal}
          onChange={(e) => onChange(parseFloat(e.target.value) / 100)}
          className={clsx("w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer z-10", color)}
          data-interactive="true"
        />
      </div>
    </div>
  );
};
