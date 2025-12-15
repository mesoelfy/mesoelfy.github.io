import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, memo } from 'react';
import { GameBootstrapper } from '@/sys/services/GameBootstrapper';
import { GameEngineCore } from '@/sys/services/GameEngine';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { InputSystem } from '@/sys/systems/InputSystem';
import { IPanelSystem } from '@/engine/interfaces';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

// OPTIMIZATION: Memoize to prevent re-initialization on parent re-renders
export const GameDirector = memo(() => {
  const { viewport, size } = useThree();
  const engineRef = useRef<GameEngineCore | null>(null);
  const isMobileRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
        isMobileRef.current = window.matchMedia('(pointer: coarse)').matches || 
                              ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const engine = GameBootstrapper();
    engineRef.current = engine;

    engine.updateViewport(viewport.width, viewport.height, size.width, size.height);
    
    try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.updateBounds(viewport.width, viewport.height);
    } catch {}
    
    // Panel Refresh Loop (10Hz) - Now using ServiceLocator
    const refreshInterval = setInterval(() => {
        try {
            const panelSys = ServiceLocator.getSystem<IPanelSystem>('PanelRegistrySystem');
            panelSys.refreshAll();
        } catch {}
    }, 500);

    let initialPolls = 0;
    const fastPoll = setInterval(() => {
        try {
            const panelSys = ServiceLocator.getSystem<IPanelSystem>('PanelRegistrySystem');
            panelSys.refreshAll();
        } catch {}
        
        initialPolls++;
        if (initialPolls > 20) clearInterval(fastPoll); 
    }, 100);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(refreshInterval);
      clearInterval(fastPoll);
      engine.teardown();
      engineRef.current = null;
    };
  }, []); 

  // Handle Resize updates
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateViewport(viewport.width, viewport.height, size.width, size.height);
      try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.updateBounds(viewport.width, viewport.height);
      } catch {}
    }
  }, [viewport, size]);

  // Main Loop
  useFrame((state, delta) => {
    if (engineRef.current) {
      try {
          const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
          if (!isMobileRef.current) {
              const x = (state.pointer.x * viewport.width) / 2;
              const y = (state.pointer.y * viewport.height) / 2;
              input.updateCursor(x, y);
          }
          engineRef.current.update(delta, state.clock.elapsedTime);
      } catch (e: any) {
          console.error("Game Loop Critical Failure:", e);
          GameEventBus.emit(GameEvents.LOG_DEBUG, { 
              msg: `CRITICAL LOOP FAIL: ${e.message}`, 
              source: 'GameDirector' 
          });
      }
    }
  });

  return null;
});

GameDirector.displayName = 'GameDirector';
