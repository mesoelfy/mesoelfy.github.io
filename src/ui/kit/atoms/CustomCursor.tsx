import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { clsx } from 'clsx';

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isOnScrollbar, setIsOnScrollbar] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const hitTimer = useRef<NodeJS.Timeout | null>(null);
  
  // We include sessionId to force re-subscription on game reset
  const { bootState, activeModal, isDebugOpen, isBreaching, sessionId } = useStore();
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  
  const isGameActive = bootState === 'active' || bootState === 'mobile_lockdown';
  const isMenuOpen = activeModal !== 'none' || isDebugOpen;
  const isGameOver = systemIntegrity <= 0;

  // Show Cursor if:
  // 1. Not in Game
  // 2. OR Menu is Open
  // 3. OR Mobile Lockdown
  // 4. OR Game Over (This allows clicking the Purge Button)
  const showCustomCursor = ((!isGameActive && !isBreaching) || isMenuOpen || bootState === 'mobile_lockdown' || isGameOver) && !isOnScrollbar;

  // Hit Detection Logic
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
  }, [sessionId, bootState]); // Dependency on sessionId ensures we listen to the active Engine instance

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('button, a, input, label, [data-interactive="true"]'));

      const onScroll = e.clientX >= window.innerWidth - 14 || e.clientY >= window.innerHeight - 14;
      setIsOnScrollbar(onScroll);

      if (onScroll) {
          document.body.style.setProperty('cursor', 'auto', 'important');
      } else {
          document.body.style.setProperty('cursor', 'none', 'important');
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
      document.body.style.cursor = 'auto'; 
    };
  }, [isGameActive, isMenuOpen, isBreaching, isGameOver]);

  const cursorColor = isHit ? '#FF003C' : (isHovering ? '#eae747' : '#78F654');
  const cursorShadow = isHit 
    ? 'drop-shadow(0 0 15px #FF003C)' 
    : (isHovering ? 'drop-shadow(0 0 12px #eae747)' : 'drop-shadow(0 0 8px #78F654)');

  return (
    <>
      <motion.div
        className={clsx(
            "fixed top-0 left-0 pointer-events-none z-[20000]", 
            (isHovering && showCustomCursor && !isHit) ? "mix-blend-difference" : "" 
        )}
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
                className={`transition-transform duration-100 ${isClicking ? 'scale-90' : 'scale-100'} ${isHit ? 'scale-125' : ''}`}
                style={{ 
                    filter: cursorShadow,
                    fill: cursorColor,
                    transition: 'fill 0.1s ease, filter 0.1s ease'
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
