import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { GameBootstrapper } from '../core/GameBootstrapper';
import { GameEngineCore } from '../core/GameEngine';
import { ServiceLocator } from '../core/ServiceLocator';
import { InputSystem } from '../systems/InputSystem';

// We export the active engine instance for the Renderer components to access via import
// This is a "Module Singleton" pattern common in hybrid React/Game apps.
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

    return () => {
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
      // Sync Input from R3F (Temporary, until InputSystem adds its own listeners)
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
