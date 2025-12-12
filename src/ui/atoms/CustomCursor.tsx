import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/core/store/useStore';
import { clsx } from 'clsx';

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isOnScrollbar, setIsOnScrollbar] = useState(false);
  
  const { bootState, activeModal, isDebugOpen } = useStore();
  
  const isGameActive = bootState === 'active';
  const isMenuOpen = activeModal !== 'none' || isDebugOpen;
  
  // LOGIC: Show custom cursor unless we are on the scrollbar
  // If game is active (and no menu), we usually hide it (crosshair logic), 
  // but if we are on scrollbar, we always want system cursor.
  const showCustomCursor = (!isGameActive || isMenuOpen) && !isOnScrollbar;

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      
      // 1. Interactive Element Check
      const isInteractive = target.closest('button, a, input, label, [data-interactive="true"]');
      setIsHovering(!!isInteractive);

      // 2. Scrollbar Detection (Right Edge & Bottom Edge)
      // We give a 14px buffer (Scrollbar is 8px, but hitboxes can vary)
      const isRightEdge = e.clientX >= window.innerWidth - 14;
      const isBottomEdge = e.clientY >= window.innerHeight - 14;
      
      const onScroll = isRightEdge || isBottomEdge;
      setIsOnScrollbar(onScroll);

      // 3. System Cursor Toggle
      // If we are on the scrollbar, we MUST let the browser show the default arrow
      if (onScroll) {
          document.body.style.setProperty('cursor', 'auto', 'important');
      } else {
          // Otherwise, hide it if we are showing our custom one, or if game is active
          if ((!isGameActive || isMenuOpen)) {
              document.body.style.setProperty('cursor', 'none', 'important');
          } else {
              // Game active, no menu = Crosshair (Canvas handles cursor usually, or none)
              document.body.style.setProperty('cursor', 'none', 'important');
          }
      }
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
      document.body.style.cursor = 'auto'; // Cleanup
    };
  }, [isGameActive, isMenuOpen]);

  return (
    <>
      <motion.div
        className={clsx(
            "fixed top-0 left-0 pointer-events-none z-[20000]", 
            (isHovering && showCustomCursor) ? "mix-blend-difference" : "" 
        )}
        // ALIGNMENT FIX:
        // The SVG path 'M5.5 3.21' starts ~5.5px right and ~3.2px down.
        // We offset the container by negative that amount to make the visual tip match the actual mouse X/Y.
        animate={{ x: pos.x - 5.5, y: pos.y - 3.2 }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      >
        <AnimatePresence mode="wait">
          {showCustomCursor && (
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
