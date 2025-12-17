import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, memo } from 'react';
import { GameBootstrapper } from '@/engine/services/GameBootstrapper';
import { GameEngineCore } from '@/engine/services/GameEngine';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { InputSystem } from '@/engine/systems/InputSystem';
import { IPanelSystem } from '@/engine/interfaces';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { useStore } from '@/engine/state/global/useStore';

export const GameDirector = memo(() => {
  const { viewport, size } = useThree();
  const engineRef = useRef<GameEngineCore | null>(null);
  const isMobileRef = useRef(false);
  const initialClickPos = useStore(state => state.initialClickPos);

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

  useEffect(() => {
      if (!initialClickPos || isMobileRef.current || !engineRef.current) return;
      try {
          const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
          input.updateBounds(viewport.width, viewport.height);
          const wx = (initialClickPos.x / size.width) * viewport.width - (viewport.width / 2);
          const wy = -((initialClickPos.y / size.height) * viewport.height - (viewport.height / 2));
          input.updateCursor(wx, wy);
      } catch {}
  }, [initialClickPos, viewport, size]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateViewport(viewport.width, viewport.height, size.width, size.height);
      try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.updateBounds(viewport.width, viewport.height);
      } catch {}
    }
  }, [viewport, size]);

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
          GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `CRITICAL LOOP FAIL: ${e.message}`, source: 'GameDirector' });
      }
    }
  });

  return null;
});

GameDirector.displayName = 'GameDirector';
