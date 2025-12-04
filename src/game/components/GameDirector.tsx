import { useFrame, useThree } from '@react-three/fiber';
import { GameEngine } from '../core/GameEngine';
import { useEffect } from 'react';

export const GameDirector = () => {
  const { viewport, size } = useThree();

  // FIXED: Using single updateViewport method
  useEffect(() => {
    GameEngine.updateViewport(viewport.width, viewport.height, size.width, size.height);
  }, [viewport, size]);

  useFrame((state, delta) => {
    GameEngine.update(delta, state.clock.elapsedTime);
  });

  return null;
};
