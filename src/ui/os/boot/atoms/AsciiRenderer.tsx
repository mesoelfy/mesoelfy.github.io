import { useMemo } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { ASCII_TITLE } from '@/engine/config/TextAssets';

export const AsciiRenderer = () => {
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isHigh = graphicsMode === 'HIGH';

  const renderedChars = useMemo(() => {
    // Trim leading newline to prevent layout jump at top
    const cleanTitle = ASCII_TITLE.replace(/^\n/, '');
    
    return cleanTitle.split('').map((char, i) => {
      if (char === '\n') return <br key={i} />;
      if (char === ' ') return <span key={i}> </span>;

      let baseClass = 'transition-colors duration-300 ';
      let animClass = '';
      
      if (['█', '▀', '▄', '▌', '▐'].includes(char)) {
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
        <span key={i} className={finalClass} style={style}>
          {char}
        </span>
      );
    });
  }, [isHigh]); 

  return (
    // Tighter leading (0.95) to compact the block and removed extra top whitespace
    <div className="font-mono font-bold leading-[0.95] whitespace-pre text-center select-none overflow-hidden text-[4px] xs:text-[6px] sm:text-[9px] md:text-[11px] shrink-0">
      {renderedChars}
    </div>
  );
};
