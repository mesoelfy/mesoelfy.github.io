import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PALETTE } from '@/engine/config/Palette';

interface StatsRadarProps {
  stats: Record<string, number>;
  color?: string;
  size?: number;
}

export const StatsRadar = ({ stats, color = PALETTE.GREEN.PRIMARY, size = 200 }: StatsRadarProps) => {
  const keys = Object.keys(stats);
  const total = keys.length;
  const radius = size / 2;
  const center = size / 2;
  const angleStep = (Math.PI * 2) / total;

  // Helper to get coordinates
  const getPoint = (index: number, value: number) => {
    // -PI/2 to start at top
    const angle = (index * angleStep) - (Math.PI / 2);
    // Normalize value (assumes max 100)
    const dist = (value / 100) * radius; 
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    return { x, y };
  };

  const polyPoints = useMemo(() => {
    return keys.map((key, i) => {
      const { x, y } = getPoint(i, stats[key]);
      return `${x},${y}`;
    }).join(' ');
  }, [stats]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        
        {/* Background Web */}
        {[0.25, 0.5, 0.75, 1.0].map((scale) => (
          <polygon
            key={scale}
            points={keys.map((_, i) => {
               const { x, y } = getPoint(i, 100 * scale);
               return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.2"
          />
        ))}

        {/* Axis Lines */}
        {keys.map((_, i) => {
            const p = getPoint(i, 100);
            return (
                <line 
                    key={i} 
                    x1={center} y1={center} 
                    x2={p.x} y2={p.y} 
                    stroke={color} 
                    strokeOpacity="0.1" 
                />
            );
        })}

        {/* The Data Shape */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1, type: 'spring' }}
          points={polyPoints}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Vertices */}
        {keys.map((key, i) => {
            const p = getPoint(i, stats[key]);
            const labelP = getPoint(i, 115); // Push labels out
            return (
                <g key={key}>
                    <motion.circle 
                        initial={{ r: 0 }}
                        animate={{ r: 3 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        cx={p.x} cy={p.y} fill={color} 
                    />
                    <text 
                        x={labelP.x} y={labelP.y} 
                        fill={color} 
                        fontSize="10" 
                        fontFamily="monospace" 
                        textAnchor="middle" 
                        alignmentBaseline="middle"
                        className="font-bold tracking-widest uppercase"
                    >
                        {key}
                    </text>
                </g>
            );
        })}
      </svg>
    </div>
  );
};
