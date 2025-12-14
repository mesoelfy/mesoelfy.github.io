import { clsx } from 'clsx';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { getPan } from '@/core/audio/AudioUtils';
import { useRef, useState, useEffect } from 'react';

interface RangeSliderProps {
  label: string;
  value: number; 
  onChange: (val: number) => void;
  max?: number; 
  step?: number;
  displayMax?: number; 
  format?: (val: number) => string;
  markerValue?: number; 
  color?: string;
}

export const RangeSlider = ({ 
  label, 
  value, 
  onChange, 
  max = 3.0,
  step = 0.01,
  markerValue = 1.0,
  format,
  color
}: RangeSliderProps) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastTickRef = useRef(value);
  const lastPanRef = useRef(0);

  // Safety
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const percent = Math.min(100, Math.max(0, (safeValue / max) * 100));

  // Audio Tick Logic
  useEffect(() => {
    const threshold = max * 0.05;
    if (Math.abs(safeValue - lastTickRef.current) >= threshold) {
        if (isDragging) {
            AudioSystem.playHover(lastPanRef.current);
        }
        lastTickRef.current = safeValue;
    }
  }, [safeValue, max, isDragging]);

  useEffect(() => {
      if (!isDragging) lastTickRef.current = safeValue;
  }, [safeValue, isDragging]);

  let activeColor = "bg-primary-green";
  let activeText = "text-primary-green";
  let glowClass = "shadow-[0_0_10px_#78F654]";

  if (percent > 80) {
      activeColor = "bg-alert-yellow";
      activeText = "text-alert-yellow";
      glowClass = "shadow-[0_0_10px_#eae747]";
  }
  if (percent > 95) {
      activeColor = "bg-critical-red";
      activeText = "text-critical-red";
      glowClass = "shadow-[0_0_15px_#FF003C]";
  }
  if (color) activeText = color.replace('bg-', 'text-').replace('border-', 'text-');

  const displayString = format ? format(safeValue) : `${Math.round(percent)}%`;
  const segments = 20;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateValue(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateValue = (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      
      // Update pan reference for audio tick
      lastPanRef.current = getPan(e);

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = x / rect.width;
      
      let rawValue = ratio * max;
      if (step > 0) {
          rawValue = Math.round(rawValue / step) * step;
      }
      const finalValue = Math.max(0, Math.min(max, rawValue));
      
      if (finalValue !== safeValue) {
          onChange(finalValue);
      }
  };

  return (
    <div 
        className="flex flex-col gap-1 w-full select-none touch-none"
        onMouseEnter={(e) => AudioSystem.playHover(getPan(e))}
    >
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-bold font-header tracking-widest text-gray-500 group-hover:text-white transition-colors uppercase">
            {label}
        </span>
        <span className={clsx("text-[10px] font-mono font-bold transition-colors bg-black/50 px-1.5 rounded-sm border border-white/10 min-w-[3rem] text-center", activeText)}>
            {displayString}
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="relative h-6 w-full flex items-center cursor-pointer group/slider py-1"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-x-0 h-2 flex justify-between items-center px-[1px] pointer-events-none z-0 opacity-30 bg-black/50 border border-white/10 rounded-sm">
            {Array.from({ length: segments }).map((_, i) => (
                <div key={i} className="w-[1px] h-1.5 bg-gray-500" />
            ))}
        </div>

        <div 
            className="absolute left-0 h-2 top-2 z-10 pointer-events-none transition-none rounded-sm overflow-hidden" 
            style={{ width: `${percent}%` }}
        >
            <div className={clsx("w-full h-full opacity-80", activeColor, glowClass)} />
        </div>

        <div 
            className={clsx(
                "absolute h-4 w-1 top-1 z-20 pointer-events-none shadow-sm transition-transform duration-100",
                activeColor === "bg-primary-green" ? "bg-white" : activeColor,
                isDragging ? "scale-y-125 scale-x-110 brightness-150" : "group-hover/slider:scale-y-110"
            )}
            style={{ 
                left: `${percent}%`, 
                transform: `translateX(-50%) ${isDragging ? 'scale(1.2)' : ''}` 
            }} 
        />
        
        {markerValue !== undefined && (
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/50 pointer-events-none z-0" 
                style={{ left: `${(markerValue / max) * 100}%` }} 
            />
        )}
      </div>
    </div>
  );
};
