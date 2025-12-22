import { useMemo } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { ASCII_TITLE } from '@/engine/config/TextAssets';
import { motion } from 'framer-motion';
import { PALETTE } from '@/engine/config/Palette';

interface Props {
  step: number;
}

export const AsciiRenderer = ({ step }: Props) => {
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isHigh = graphicsMode === 'HIGH';

  const grid = useMemo(() => {
    const cleanTitle = ASCII_TITLE.replace(/^\n/, '');
    const rows = cleanTitle.split('\n');
    return rows.map((row) => {
      return row.split('').map((char) => ({
        char,
        rand: Math.random(),
        delay: Math.random() * 2
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

            let baseClass = 'transition-colors duration-500 ';
            let animClass = '';
            
            // NOTE: Matrix colors are hard to do with classes + dynamic palette
            // We'll map them to the closest Tailwind class defined in the config which matches the Palette
            // or we could inline style color. Let's assume standard tailwind classes exist for these core colors.
            // However, to strictly follow the palette request, we should use inline styles or standard colors.
            // But 'animate-matrix-red' relies on keyframes in tailwind.config.ts which are HARDCODED.
            // Changing palette.ts doesn't change keyframes.
            // We updated the hexes in the previous step, so 'text-critical-red' is correct.
            
            if (step === 3) {
                // RED PHASE (70% Red)
                if (cell.rand < 0.7) {
                    baseClass += 'text-critical-red';
                    animClass = 'animate-matrix-red';
                } else {
                    baseClass += 'text-primary-green-dark';
                    animClass = 'animate-matrix-green';
                }
            } else if (step === 4) {
                // PURPLE PHASE (30G / 40P / 30R)
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
            } else if (step >= 5) { 
                // DECRYPTED PHASE (35G / 45P / 20R)
                if (cell.rand < 0.35) {
                    baseClass += 'text-primary-green-dark';
                    animClass = 'animate-matrix-green';
                } else if (cell.rand < 0.80) {
                    baseClass += 'text-latent-purple';
                    animClass = 'animate-matrix-purple';
                } else {
                    baseClass += 'text-critical-red';
                    animClass = 'animate-matrix-red';
                }
            } else {
                // DEFAULT GREEN
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
