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

  const rows = useMemo(() => {
    const cleanTitle = ASCII_TITLE.replace(/^\n/, '');
    return cleanTitle.split('\n');
  }, []);

  return (
    <div className="font-mono font-bold leading-[0.95] whitespace-pre text-center select-none overflow-hidden text-[11px] shrink-0">
      {rows.map((row, rowIndex) => (
        <motion.div
          key={rowIndex}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
        >
          {row.split('').map((char, charIndex) => {
            if (char === ' ') return <span key={charIndex}> </span>;

            let baseClass = 'transition-colors duration-300 ';
            let animClass = '';
            
            // COLOR LOGIC:
            // Step 3 = Red (Unsafe)
            // Step 4 = Purple (Bypass)
            // Else   = Green (Normal)
            
            if (step === 3) {
                // RED PHASE
                baseClass += 'text-critical-red';
                animClass = 'animate-matrix-red';
            } else if (step === 4) {
                // PURPLE PHASE
                baseClass += 'text-latent-purple';
                animClass = 'animate-matrix-purple';
            } else {
                // GREEN PHASE (Default)
                if (['█', '▀', '▄', '▌', '▐'].includes(char)) {
                    baseClass += 'text-primary-green-dark';
                    animClass = 'animate-matrix-green';
                } else if (['░', '▒', '▓'].includes(char)) {
                    // In Green phase, shading blocks are just dim green
                    baseClass += 'text-primary-green-dim';
                    animClass = 'animate-matrix-green';
                } else {
                    baseClass += 'text-primary-green-dark';
                }
            }

            const finalClass = isHigh ? `${baseClass} ${animClass}` : baseClass;
            const style = isHigh ? { animationDelay: Math.random() * 2 + 's' } : {};

            return (
              <span key={charIndex} className={finalClass} style={style}>
                {char}
              </span>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
};
