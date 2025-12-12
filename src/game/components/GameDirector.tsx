import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { GameBootstrapper } from '../core/GameBootstrapper';
import { GameEngineCore } from '../core/GameEngine';
import { ServiceLocator } from '../core/ServiceLocator';
import { InputSystem } from '../systems/InputSystem';
import { PanelRegistry } from '../systems/PanelRegistrySystem';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';

export let ActiveEngine: GameEngineCore | null = null;

export const GameDirector = () => {
  const { viewport, size } = useThree();
  const engineRef = useRef<GameEngineCore | null>(null);
  
  // Track if device supports touch to disable tap-to-move
  const isTouchDevice = useRef(false);

  useEffect(() => {
    // Robust touch detection
    isTouchDevice.current = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

    const engine = GameBootstrapper();
    engineRef.current = engine;
    ActiveEngine = engine;

    engine.updateViewport(viewport.width, viewport.height, size.width, size.height);
    
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
          
          // INPUT LOGIC:
          // If on a touch device, we IGNORE the mouse/touch position for cursor movement.
          // This allows the user to tap UI elements (like upgrades) without the ship 
          // flying to that location. Movement is handled solely by InputSystem reading
          // the VirtualJoystick service.
          
          if (!isTouchDevice.current) {
              const x = (state.pointer.x * viewport.width) / 2;
              const y = (state.pointer.y * viewport.height) / 2;
              input.updateCursor(x, y);
          }

          // Render Loop
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
};
