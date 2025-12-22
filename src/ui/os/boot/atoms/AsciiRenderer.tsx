import { useMemo } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { ASCII_TITLE } from '@/engine/config/TextAssets';
import { motion } from 'framer-motion';

interface Props {
  step: number;
}

export const AsciiRenderer = ({ step }: Props) => {
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isHigh = graphicsMode === 'HIGH';

  // Memoize the grid structure and assigned random values so they don't change on re-renders
  const grid = useMemo(() => {
    const cleanTitle = ASCII_TITLE.replace(/^\n/, '');
    const rows = cleanTitle.split('\n');
    return rows.map((row) => {
      return row.split('').map((char) => ({
        char,
        rand: Math.random(), // Stable random value for color logic
        delay: Math.random() * 2 // Stable delay
      }));
    });
  }, []);

  return (
    <div className="font-mono font-bold leading-[0.95] whitespace-pre text-center select-none overflow-hidden text-[11px] shrink-0">
      {grid.map((row, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
        >
          {row.map((cell, charIndex) => {
            if (cell.char === ' ') return <span key={charIndex}> </span>;

            let baseClass = 'transition-colors duration-500 '; // Smooth transition
            let animClass = '';
            
            // COLOR LOGIC (Matching Rain)
            if (step === 3) {
                // RED PHASE: 70% Red, 30% Green
                if (cell.rand < 0.7) {
                    baseClass += 'text-critical-red';
                    animClass = 'animate-matrix-red';
                } else {
                    baseClass += 'text-primary-green-dark';
                    animClass = 'animate-matrix-green';
                }
            } else if (step === 4) {
                // PURPLE PHASE: 30% Green, 40% Purple, 30% Red
                if (cell.rand < 0.3) {
                    baseClass += 'text-primary-green-dark';
                    animClass = 'animate-matrix-green';
                } else if (cell.rand < 0.7) {
                    baseClass += 'text-latent-purple';
                    animClass = 'animate-matrix-purple';
                } else {
                    baseClass += 'text-critical-red';
                    animClass = 'animate-matrix-red';
                }
            } else {
                // GREEN PHASE (Default)
                if (['█', '▀', '▄', '▌', '▐'].includes(cell.char)) {
                    baseClass += 'text-primary-green-dark';
                    animClass = 'animate-matrix-green';
                } else if (['░', '▒', '▓'].includes(cell.char)) {
                    baseClass += 'text-primary-green-dim';
                    animClass = 'animate-matrix-green';
                } else {
                    baseClass += 'text-primary-green-dark';
                }
            }

            const finalClass = isHigh ? `${baseClass} ${animClass}` : baseClass;
            const style = isHigh ? { animationDelay: `${cell.delay}s` } : {};

            return (
              <span key={charIndex} className={finalClass} style={style}>
                {cell.char}
              </span>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
};
