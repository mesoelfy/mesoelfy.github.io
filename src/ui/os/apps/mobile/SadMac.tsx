import { Frown } from 'lucide-react';

export const SadMac = ({ className }: { className?: string }) => (
  <div className={`relative w-24 h-24 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,0,60,0.5)]">
      <path 
        d="M10 20 C10 10 20 10 30 10 L70 10 C80 10 90 10 90 20 L90 80 C90 90 80 95 50 95 C20 95 10 90 10 80 Z" 
        fill="none" 
        stroke="#FF003C" 
        strokeWidth="4"
      />
      <line x1="10" y1="20" x2="25" y2="20" stroke="#FF003C" strokeWidth="4" />
      <line x1="75" y1="20" x2="90" y2="20" stroke="#FF003C" strokeWidth="4" />
      <circle cx="35" cy="40" r="4" fill="#FF003C" />
      <circle cx="65" cy="40" r="4" fill="#FF003C" />
      <path d="M50 45 L45 60 L55 60 Z" fill="#FF003C" />
    </svg>
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-critical-red">
        <Frown size={24} strokeWidth={2.5} />
    </div>
  </div>
);
