import { useFrame, useThree } from '@react-three/fiber';
import { GameEngine } from '../core/GameEngine';
import { useEffect } from 'react';

export const GameDirector = () => {
  const { viewport } = useThree();

  // Sync Viewport dimensions to Engine (for spawn logic)
  useEffect(() => {
    GameEngine.updateDimensions(viewport.width, viewport.height);
  }, [viewport]);

  useFrame((state, delta) => {
    // Run the logic simulation
    GameEngine.update(delta, state.clock.elapsedTime);
  });

  return null; // Invisible Logic Component
};
