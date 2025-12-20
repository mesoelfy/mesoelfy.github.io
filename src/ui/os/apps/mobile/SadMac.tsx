import { Monitor } from 'lucide-react';

export const SadMac = ({ className }: { className?: string }) => (
  <div className={`relative w-32 h-32 ${className}`}>
    <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,0,60,0.5)] overflow-visible">
      
      {/* Monitor Base */}
      <rect x="10" y="5" width="100" height="60" rx="4" fill="none" stroke="#FF003C" strokeWidth="2" />
      <rect x="16" y="11" width="88" height="48" fill="#FF003C" fillOpacity="0.1" />
      
      {/* Stand */}
      <path d="M50 65 L50 75 L40 85 H80 L70 75 L70 65" fill="none" stroke="#FF003C" strokeWidth="2" />
      
      {/* Keyboard */}
      <path d="M20 90 L15 95 H105 L100 90 Z" fill="none" stroke="#FF003C" strokeWidth="2" />
      <line x1="30" y1="92" x2="90" y2="92" stroke="#FF003C" strokeWidth="2" strokeDasharray="4 4" />

      {/* Screen Glitch */}
      <path d="M30 35 L90 35" stroke="#FF003C" strokeWidth="2" />
      <path d="M30 45 L70 45" stroke="#FF003C" strokeWidth="2" />
      <path d="M45 25 L55 35 L45 45" stroke="#FF003C" strokeWidth="2" fill="none" />
    </svg>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-critical-red animate-pulse">
        <Monitor size={24} strokeWidth={3} />
    </div>
  </div>
);
