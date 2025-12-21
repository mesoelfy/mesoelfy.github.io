import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { clsx } from 'clsx';
import { DOM_ATTR } from '@/ui/config/DOMConfig';

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isOnScrollbar, setIsOnScrollbar] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const hitTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { bootState, activeModal, isDebugOpen, isBreaching, sessionId, isMetamorphosizing } = useStore();
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const isZenMode = useGameStore(state => state.isZenMode);
  
  const isGameActive = bootState === 'active';
  const isMenuOpen = activeModal !== 'none' || isDebugOpen;
  const isGameOver = systemIntegrity <= 0;

  // HIDE LOGIC:
  // 1. Hide if isMetamorphosizing is true (the "void" gap)
  // 2. Otherwise show if game is inactive, menu is open, it's game over, or we are in Zen mode.
  const showCustomCursor = !isMetamorphosizing && ((!isGameActive && !isBreaching) || isMenuOpen || (isGameOver && !isZenMode) || isZenMode) && !isOnScrollbar;

  const hideSystemCursor = !isOnScrollbar;

  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => {
          setIsHit(true);
          if (hitTimer.current) clearTimeout(hitTimer.current);
          hitTimer.current = setTimeout(() => setIsHit(false), 150);
      });
      return () => {
          unsub();
          if (hitTimer.current) clearTimeout(hitTimer.current);
      };
  }, [sessionId, bootState]);

  useEffect(() => {
      if (hideSystemCursor) {
          document.body.classList.add('cursor-none');
          document.body.style.cursor = 'none';
      } else {
          document.body.classList.remove('cursor-none');
          document.body.style.cursor = 'auto';
      }
      return () => {
          document.body.classList.remove('cursor-none');
          document.body.style.cursor = 'auto';
      };
  }, [hideSystemCursor]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest(`button, a, input, label, [${DOM_ATTR.INTERACTIVE}="true"]`));
      const onScroll = e.clientX >= window.innerWidth - 14 || e.clientY >= window.innerHeight - 14;
      setIsOnScrollbar(onScroll);
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

  const cursorColor = isHit ? '#FF003C' : (isHovering ? '#eae747' : '#78F654');
  const cursorShadow = isHit 
    ? 'drop-shadow(0 0 15px #FF003C)' 
    : (isHovering ? 'drop-shadow(0 0 12px #eae747)' : 'drop-shadow(0 0 8px #78F654)');

  return (
    <motion.div
      className={clsx("fixed top-0 left-0 pointer-events-none z-cursor", (isHovering && showCustomCursor && !isHit) ? "mix-blend-difference" : "" )}
      animate={{ x: pos.x - (isZenMode ? 16 : 5.5), y: pos.y - (isZenMode ? 16 : 3.2) }}
      transition={{ type: "tween", ease: "linear", duration: 0 }}
    >
      <AnimatePresence mode="wait">
        {showCustomCursor && (
          <motion.div 
            key={isZenMode ? "zen-cursor" : "standard-cursor"} 
            initial={{ opacity: 0, scale: 0 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0 }} 
            transition={{ duration: 0.3 }} 
            className="relative"
          >
            {isZenMode ? (
                <motion.div 
                    className="flex items-center justify-center w-8 h-8"
                    animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"], scale: [1, 1.15, 1], rotate: [0, 360] }}
                    transition={{ 
                      filter: { duration: 4, repeat: Infinity, ease: "linear" }, 
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                      rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                    }}
                >
                    {/* PRISMATIC TRIANGLE */}
                    <svg width="28" height="28" viewBox="0 0 24 24" style={{ fill: "#FFFFFF", filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}>
                         <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                    </svg>
                </motion.div>
            ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" className={`transition-transform duration-100 ${isClicking ? 'scale-90' : 'scale-100'} ${isHit ? 'scale-125' : ''}`} style={{ filter: cursorShadow, fill: cursorColor, transition: 'fill 0.1s ease, filter 0.1s ease' }}>
                    <path d="M5.5 3.21l12.32 12.32-4.5 1.12 3.5 3.5-2.12 2.12-3.5-3.5-1.12 4.5z" />
                </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
