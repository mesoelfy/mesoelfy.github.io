import { useMemo } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { ASCII_TITLE } from '@/engine/config/TextAssets';
import { motion } from 'framer-motion';

interface Props {
  isInfected: boolean;
}

export const AsciiRenderer = ({ isInfected }: Props) => {
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isHigh = graphicsMode === 'HIGH';

  const rows = useMemo(() => {
    const cleanTitle = ASCII_TITLE.replace(/^\n/, '');
    return cleanTitle.split('\n');
  }, []);

  return (
    // SIZE UPDATE: text-[9px] -> text-[11px]
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
            
            const isRed = isInfected && Math.random() > 0.7;

            if (isRed) {
                baseClass += 'text-critical-red';
                animClass = 'animate-matrix-red';
            } else if (['█', '▀', '▄', '▌', '▐'].includes(char)) {
                baseClass += 'text-primary-green-dark';
                animClass = 'animate-matrix-green';
            } else if (['░', '▒', '▓'].includes(char)) {
                baseClass += 'text-latent-purple';
                animClass = 'animate-matrix-purple';
            } else {
                baseClass += 'text-primary-green-dark';
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
