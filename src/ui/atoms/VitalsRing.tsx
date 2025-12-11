import { MiniCrystalCanvas } from '@/scene/props/MiniCrystalCanvas';
import { Unplug } from 'lucide-react';
import { clsx } from 'clsx';

interface VitalsRingProps {
  health: number;
  maxHealth: number;
  xp: number;
  xpToNext: number;
  level: number;
  isDead: boolean;
  rebootProgress: number;
}

export const VitalsRing = ({ 
  health, 
  maxHealth, 
  xp, 
  xpToNext, 
  level, 
  isDead, 
  rebootProgress 
}: VitalsRingProps) => {
  
  const hpPercent = Math.max(0, (health / maxHealth) * 100);
  const xpPercent = xpToNext > 0 ? Math.min(100, (xp / xpToNext) * 100) : 0;

  // --- SVG CONFIG ---
  const size = 160; 
  const center = size / 2;
  const radiusHp = 60;
  const radiusXp = 70;
  const stroke = 4;
  
  const circHp = 2 * Math.PI * radiusHp;
  const circXp = 2 * Math.PI * radiusXp;

  const displayHpPercent = isDead ? rebootProgress : hpPercent;
  const displayHpColor = isDead ? "#eae747" : (hpPercent < 30 ? "#FF003C" : "#78F654"); 

  const offsetHp = circHp - (displayHpPercent / 100 * circHp);
  const offsetXp = circXp - (xpPercent / 100 * circXp);

  return (
    <div className="relative w-40 h-40 shrink-0 group mb-1"> 
        
        {/* 3D Canvas */}
        <div className={clsx(
            "absolute inset-0 rounded-full bg-black/50 overflow-hidden transition-opacity duration-500 clip-circle",
            isDead ? "opacity-60 grayscale" : "opacity-100"
        )}>
           <MiniCrystalCanvas />
        </div>

        {/* Status Overlays */}
        {isDead && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                {rebootProgress > 0 ? (
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-header font-black text-alert-yellow drop-shadow-md animate-pulse">
                            {Math.floor(rebootProgress)}%
                        </span>
                        <span className="text-[8px] text-alert-yellow font-mono tracking-widest bg-black/80 px-2 mt-1">REBOOTING</span>
                    </div>
                ) : (
                    <div className="animate-pulse flex flex-col items-center">
                        <Unplug className="text-white/50 w-8 h-8 mb-1" />
                        <span className="text-[8px] text-critical-red font-mono bg-black/80 px-2">SIGNAL_LOST</span>
                    </div>
                )}
            </div>
        )}

        {/* SVG RINGS */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radiusHp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" />
          <circle cx={center} cy={center} r={radiusXp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" strokeDasharray="2 4" />
          
          <circle 
            cx={center} cy={center} r={radiusHp} 
            stroke={displayHpColor} 
            strokeWidth={stroke} fill="transparent"
            strokeDasharray={circHp}
            strokeDashoffset={offsetHp}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            // UPDATED: duration-300 for snappy decay
            className="transition-all duration-300 ease-out"
          />
          
          <circle 
            cx={center} cy={center} r={radiusXp} 
            stroke="#9E4EA5" 
            strokeWidth={stroke} fill="transparent"
            strokeDasharray={circXp}
            strokeDashoffset={offsetXp}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-500 ease-out"
          />

          <defs>
              <path id="levelCurve" d="M 25,80 A 55,55 0 0,0 135,80" /> 
          </defs>
          
          <text fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="3" fill="#9E4EA5" style={{ filter: 'drop-shadow(0 0 2px #9E4EA5)' }}>
              <textPath href="#levelCurve" startOffset="50%" textAnchor="middle" side="right">
                  LVL_{level.toString().padStart(2, '0')}
              </textPath>
          </text>
        </svg>
    </div>
  );
};
