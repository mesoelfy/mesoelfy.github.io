import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/core/store/useStore';
import { clsx } from 'clsx';

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  const { bootState, activeModal, isDebugOpen } = useStore();
  
  // VISIBILITY LOGIC:
  // 1. If we are in STANDBY (Intro) or SANDBOX -> SHOW.
  // 2. If we are ACTIVE, only show if a Modal (Settings, etc) or Debug is open.
  
  const isGameActive = bootState === 'active';
  const isMenuOpen = activeModal !== 'none' || isDebugOpen;
  
  // If game is active, we rely on the 3D Reticle, unless a menu is overlaying it.
  const isVisible = !isGameActive || isMenuOpen;

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, label, [data-interactive="true"]');
      setIsHovering(!!isInteractive);
    };

    const down = () => setIsClicking(true);
    const up = () => setIsClicking(false);

    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        body, a, button, input, label, select, textarea { cursor: none !important; }
      `}</style>

      <motion.div
        className={clsx(
            "fixed top-0 left-0 pointer-events-none z-[20000]", 
            (isHovering && isVisible) ? "mix-blend-difference" : "" 
        )}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      >
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              key="custom-cursor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                className={`transition-transform duration-100 ${isClicking ? 'scale-90' : 'scale-100'}`}
                style={{ 
                    filter: isHovering ? 'drop-shadow(0 0 12px #eae747)' : 'drop-shadow(0 0 8px #78F654)',
                    fill: isHovering ? '#eae747' : '#78F654'
                }}
              >
                <path d="M5.5 3.21l12.32 12.32-4.5 1.12 3.5 3.5-2.12 2.12-3.5-3.5-1.12 4.5z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
