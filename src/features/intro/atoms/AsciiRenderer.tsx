import { useMemo } from 'react';
import { useStore } from '@/sys/state/global/useStore';
import { ASCII_TITLE } from '@/sys/config/TextAssets';

export const AsciiRenderer = () => {
  const graphicsMode = useStore((state) => state.graphicsMode);
  const isHigh = graphicsMode === 'HIGH';

  const renderedChars = useMemo(() => {
    return ASCII_TITLE.split('').map((char, i) => {
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
    // UPDATE: text-[4px] ensures fit on 360px screens (Galaxy S8+)
    <div className="font-mono font-bold leading-[1.1] whitespace-pre text-center select-none overflow-hidden text-[4px] xs:text-[6px] sm:text-[9px] md:text-[11px] shrink-0">
      {renderedChars}
    </div>
  );
};
