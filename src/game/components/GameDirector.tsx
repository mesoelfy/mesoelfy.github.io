import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { GameBootstrapper } from '../core/GameBootstrapper';
import { GameEngineCore } from '../core/GameEngine';
import { ServiceLocator } from '../core/ServiceLocator';
import { InputSystem } from '../systems/InputSystem';
import { PanelRegistry } from '../systems/PanelRegistrySystem';

// We export the active engine instance for the Renderer components to access via import
export let ActiveEngine: GameEngineCore | null = null;

export const GameDirector = () => {
  const { viewport, size } = useThree();
  const engineRef = useRef<GameEngineCore | null>(null);

  useEffect(() => {
    // 1. Boot the game
    const engine = GameBootstrapper();
    engineRef.current = engine;
    ActiveEngine = engine;

    // 2. Initial Viewport Sync
    engine.updateViewport(viewport.width, viewport.height, size.width, size.height);
    
    // 3. Force Layout Refresh Loop (The Fix)
    // Run every 500ms to catch animations settling (entrance) or scroll shifts
    // This is cheap (5-10 elements) and fixes the "Stale Rect" issue.
    const refreshInterval = setInterval(() => {
        PanelRegistry.refreshAll();
    }, 500);

    // 4. Force an immediate refresh chain for the first 2 seconds (Entrance Animation)
    // We poll faster during entrance to make it look responsive immediately
    let initialPolls = 0;
    const fastPoll = setInterval(() => {
        PanelRegistry.refreshAll();
        initialPolls++;
        if (initialPolls > 20) clearInterval(fastPoll); // Stop fast polling after 2s
    }, 100);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(fastPoll);
      engine.teardown();
      engineRef.current = null;
      ActiveEngine = null;
    };
  }, []); // Run once on mount

  // Sync Viewport on resize
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateViewport(viewport.width, viewport.height, size.width, size.height);
    }
  }, [viewport, size]);

  useFrame((state, delta) => {
    if (engineRef.current) {
      // Sync Input from R3F
      const input = ServiceLocator.getSystem<InputSystem>('InputSystem');
      const x = (state.pointer.x * viewport.width) / 2;
      const y = (state.pointer.y * viewport.height) / 2;
      input.updateCursor(x, y);

      // Run Loop
      engineRef.current.update(delta, state.clock.elapsedTime);
    }
  });

  return null;
};
