import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { GameBootstrapper } from '../core/GameBootstrapper';
import { GameEngineCore } from '../core/GameEngine';
import { ServiceLocator } from '../core/ServiceLocator';
import { InputSystem } from '../systems/InputSystem';
import { PanelRegistry } from '../systems/PanelRegistrySystem';

export let ActiveEngine: GameEngineCore | null = null;

export const GameDirector = () => {
  const { viewport, size } = useThree();
  const engineRef = useRef<GameEngineCore | null>(null);

  useEffect(() => {
    const engine = GameBootstrapper();
    engineRef.current = engine;
    ActiveEngine = engine;

    engine.updateViewport(viewport.width, viewport.height, size.width, size.height);
    
    // Sync Bounds to InputSystem for clamping
    try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.updateBounds(viewport.width, viewport.height);
    } catch {}
    
    const refreshInterval = setInterval(() => {
        PanelRegistry.refreshAll();
    }, 500);

    let initialPolls = 0;
    const fastPoll = setInterval(() => {
        PanelRegistry.refreshAll();
        initialPolls++;
        if (initialPolls > 20) clearInterval(fastPoll); 
    }, 100);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(fastPoll);
      engine.teardown();
      engineRef.current = null;
      ActiveEngine = null;
    };
  }, []); 

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateViewport(viewport.width, viewport.height, size.width, size.height);
      // Sync Bounds on resize
      try {
        const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
        input.updateBounds(viewport.width, viewport.height);
      } catch {}
    }
  }, [viewport, size]);

  useFrame((state, delta) => {
    if (engineRef.current) {
      // We only update cursor from mouse here. Joystick is handled by internal event listeners.
      const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
      
      // Only apply mouse if pointer is active/moving? 
      // R3F pointer is always (0,0) initially. 
      // Let InputSystem handle the priority (Mouse overrides Joystick if it moves).
      // We check if the pointer has actually moved? 
      // For now, let's just pass it. InputSystem separates "Joystick Mode".
      const x = (state.pointer.x * viewport.width) / 2;
      const y = (state.pointer.y * viewport.height) / 2;
      
      // Only push mouse updates if not using joystick to prevent fighting
      // Or rely on InputSystem's internal flag?
      // Let's call updateCursor. InputSystem will disable joystick mode if this is called.
      // Ideally we only call this if mouse actually moved.
      input.updateCursor(x, y);

      engineRef.current.update(delta, state.clock.elapsedTime);
    }
  });

  return null;
};
