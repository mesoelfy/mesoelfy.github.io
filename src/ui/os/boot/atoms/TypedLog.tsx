import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface TypedLogProps {
  text: string;
  color: string;
  speed: number;
  showDots: boolean;
  blinkCycles?: number;
  isActive: boolean;
  isPast: boolean;
}

export const TypedLog = ({ text, color, speed = 20, showDots = false, blinkCycles = 0, isActive = false, isPast = false }: TypedLogProps) => {
  const [displayed, setDisplayed] = useState("");
  const [isDoneTyping, setIsDoneTyping] = useState(false);
  
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setIsDoneTyping(false);
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        setIsDoneTyping(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  if (isPast && displayed !== text) {
    setDisplayed(text);
    setIsDoneTyping(true);
  }

  // Dot Logic
  // If active: blinking
  // If past: solid
  const showBlinking = isDoneTyping && showDots && isActive && blinkCycles > 0;
  const showSolid = isDoneTyping && showDots && (isPast || (isActive && blinkCycles === 0));

  return (
    <div className={`whitespace-nowrap font-mono ${color} flex items-center shrink-0`}>
      <span>{displayed}</span>
      
      {/* Blinking Dots */}
      {showBlinking && (
          <span 
            className="animate-pulse" 
            style={{ animationIterationCount: blinkCycles, animationDuration: '1s' }}
          >
            ...
          </span>
      )}

      {/* Solid Dots */}
      {showSolid && <span>...</span>}

      {isActive && <span className="ml-1 animate-cursor-blink text-primary-green font-bold">_</span>}
    </div>
  );
};
