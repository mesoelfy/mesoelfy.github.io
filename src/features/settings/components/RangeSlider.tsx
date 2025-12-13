import { clsx } from 'clsx';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useRef, useEffect, useState } from 'react';

interface RangeSliderProps {
  label: string;
  value: number; 
  onChange: (val: number) => void;
  max?: number; 
  step?: number;
  displayMax?: number; 
  format?: (val: number) => string;
  markerValue?: number; 
  color?: string; // Optional accent color override class
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
  
  // Safety: Ensure value is a number (fixes uncontrolled input error)
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;

  // Calculate percentage 0..100
  const percent = Math.min(100, Math.max(0, (safeValue / max) * 100));
  
  // Determine semantic color
  let activeColor = "bg-primary-green";
  let activeText = "text-primary-green";
  let glowClass = "shadow-[0_0_10px_#78F654]";

  // Heuristic: If > 80%, it's "Hot"
  if (percent > 80) {
      activeColor = "bg-alert-yellow";
      activeText = "text-alert-yellow";
      glowClass = "shadow-[0_0_10px_#eae747]";
  }
  // If > 95%, it's "Critical"
  if (percent > 95) {
      activeColor = "bg-critical-red";
      activeText = "text-critical-red";
      glowClass = "shadow-[0_0_15px_#FF003C]";
  }

  // Allow manual override
  if (color) activeText = color.replace('bg-', 'text-').replace('border-', 'text-');

  // Value Display
  const displayString = format ? format(safeValue) : `${Math.round(percent)}%`;

  // Segment generation
  const segments = 20;

  return (
    <div 
        className="flex flex-col gap-1 w-full group select-none"
        onMouseEnter={() => AudioSystem.playHover()}
    >
      {/* Header */}
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-bold font-header tracking-widest text-gray-500 group-hover:text-white transition-colors uppercase">
            {label}
        </span>
        <span className={clsx("text-[10px] font-mono font-bold transition-colors bg-black/50 px-1.5 rounded-sm border border-white/10", activeText)}>
            {displayString}
        </span>
      </div>
      
      {/* Slider Area */}
      <div className="relative h-5 w-full flex items-center">
        
        {/* Track Background (Segments) */}
        <div className="absolute inset-0 flex justify-between items-center px-[2px] pointer-events-none z-0 opacity-30">
            {Array.from({ length: segments }).map((_, i) => (
                <div key={i} className="w-[2px] h-2 bg-gray-600 rounded-sm" />
            ))}
        </div>

        {/* Active Fill */}
        <div className="absolute left-0 h-full flex items-center z-10 pointer-events-none transition-all duration-75 ease-out" style={{ width: `${percent}%` }}>
            <div className={clsx("h-2 w-full opacity-80", activeColor, glowClass)} />
            <div className={clsx("h-4 w-1 -ml-1 z-20", activeColor === "bg-primary-green" ? "bg-white" : activeColor)} />
        </div>

        {/* Input */}
        <input 
          type="range"
          min="0" 
          max={max} 
          step={step}
          value={safeValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
          data-interactive="true"
        />
        
        {/* Marker (Default) */}
        {markerValue !== undefined && (
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/30 pointer-events-none z-0" 
                style={{ left: `${(markerValue / max) * 100}%` }} 
            />
        )}
      </div>
    </div>
  );
};
