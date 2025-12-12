import { useState, useEffect } from 'react';

interface TypedLogProps {
  text: string;
  color: string;
  speed: number;
  showDots: boolean;
  isActive: boolean;
  isPast: boolean;
}

export const TypedLog = ({ text, color, speed = 20, showDots = false, isActive = false, isPast = false }: TypedLogProps) => {
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

  return (
    <div className={`whitespace-nowrap font-mono ${color} flex items-center shrink-0`}>
      <span>{displayed}</span>
      {isDoneTyping && showDots && <span>{isPast ? '...' : (Math.floor(Date.now() / 300) % 4 === 0 ? '' : '...')}</span>}
      {isActive && <span className="ml-1 animate-cursor-blink text-primary-green font-bold">_</span>}
    </div>
  );
};
