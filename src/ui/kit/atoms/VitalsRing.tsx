import { MiniCrystalCanvas } from '@/ui/sim/props/MiniCrystalCanvas';
import { Unplug } from 'lucide-react';
import { clsx } from 'clsx';
import { useGameStream } from '@/ui/hooks/useGameStream';
import { useRef, useState } from 'react';

interface VitalsRingProps {
  health: number;
  maxHealth: number;
  isDead: boolean;
  level: number;
}

export const VitalsRing = ({ health, maxHealth, isDead, level }: VitalsRingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<SVGTSpanElement>(null);
  
  const [deadState, setDeadState] = useState(isDead);
  const [rebootState, setRebootState] = useState(0);

  // Use refs to track values for ratio calculation across independent stream updates
  const hpRef = useRef(health);
  const maxHpRef = useRef(maxHealth);
  const xpMaxRef = useRef(100);

  const updateHPUI = () => {
    if (!containerRef.current) return;
    const ratio = Math.max(0, Math.min(1, hpRef.current / maxHpRef.current));
    containerRef.current.style.setProperty('--hp-progress', ratio.toString());
    
    // Dynamic Thresholds matching OS aesthetics
    let color = '#78F654'; // GREEN
    if (ratio < 0.3) color = '#FF003C';      // RED
    else if (ratio < 0.6) color = '#eae747'; // YELLOW
    
    containerRef.current.style.setProperty('--hp-color', color);
  };

  useGameStream('PLAYER_MAX_HEALTH', (val) => {
    maxHpRef.current = val;
    updateHPUI();
  });

  useGameStream('PLAYER_HEALTH', (hp) => {
      hpRef.current = hp;
      if (hp <= 0 && !deadState) setDeadState(true);
      if (hp > 0 && deadState) setDeadState(false);
      updateHPUI();
  });

  useGameStream('XP_NEXT', (v) => { xpMaxRef.current = v; });
  
  useGameStream('XP', (v) => {
      if (containerRef.current) {
          const ratio = xpMaxRef.current > 0 ? (v / xpMaxRef.current) : 0;
          containerRef.current.style.setProperty('--xp-progress', ratio.toString());
      }
  });

  useGameStream('LEVEL', (lvl) => {
      if (levelRef.current) {
          levelRef.current.textContent = `LVL_${lvl.toString().padStart(2, '0')}`;
      }
  });

  useGameStream('PLAYER_REBOOT', (val) => {
      setRebootState(val);
  });

  const size = 160; 
  const center = size / 2;
  const radiusHp = 60;
  const radiusXp = 70;
  const stroke = 4;
  const circHp = 2 * Math.PI * radiusHp;
  const circXp = 2 * Math.PI * radiusXp;

  return (
    <div 
        ref={containerRef}
        className="relative w-40 h-40 shrink-0 group mb-1"
        style={{
            '--hp-max': circHp,
            '--xp-max': circXp,
            '--hp-progress': health / maxHealth,
            '--xp-progress': 0,
            '--hp-color': '#78F654'
        } as React.CSSProperties}
    > 
        <div className={clsx("absolute inset-0 rounded-full bg-black/50 overflow-hidden transition-opacity duration-500 clip-circle", deadState ? "opacity-60 grayscale" : "opacity-100")}>
           <MiniCrystalCanvas />
        </div>
        
        {deadState && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                {rebootState > 0 ? (
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-header font-black text-alert-yellow drop-shadow-md animate-pulse">{Math.floor(rebootState)}%</span>
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

        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radiusHp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" />
          <circle cx={center} cy={center} r={radiusXp} stroke="#1a1a1a" strokeWidth={stroke} fill="transparent" strokeDasharray="2 4" />
          
          <circle 
            cx={center} cy={center} r={radiusHp} 
            strokeWidth={stroke} fill="transparent" 
            strokeDasharray={circHp} 
            strokeLinecap="round" 
            transform={`rotate(-90 ${center} ${center})`} 
            className="transition-colors duration-200"
            style={{
                stroke: 'var(--hp-color)',
                strokeDashoffset: 'calc(var(--hp-max) * (1 - var(--hp-progress)))',
                transition: 'stroke-dashoffset 0.1s linear'
            }}
          />
          
          <circle 
            cx={center} cy={center} r={radiusXp} 
            stroke="#9E4EA5" strokeWidth={stroke} fill="transparent" 
            strokeDasharray={circXp} 
            strokeLinecap="round" 
            transform={`rotate(-90 ${center} ${center})`} 
            style={{
                strokeDashoffset: 'calc(var(--xp-max) * (1 - var(--xp-progress)))',
                transition: 'stroke-dashoffset 0.1s linear'
            }}
          />
          
          <defs><path id="levelCurve" d="M 25,80 A 55,55 0 0,0 135,80" /></defs>
          <text fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="3" fill="#9E4EA5" style={{ filter: 'drop-shadow(0 0 2px #9E4EA5)' }}>
              <textPath href="#levelCurve" startOffset="50%" textAnchor="middle" side="right">
                  <tspan ref={levelRef}>LVL_{level.toString().padStart(2, '0')}</tspan>
              </textPath>
          </text>
        </svg>
    </div>
  );
};
