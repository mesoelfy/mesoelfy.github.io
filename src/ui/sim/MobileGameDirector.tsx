import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MobileBootstrapper } from '@/sys/services/MobileBootstrapper';
import { GameEngineCore } from '@/sys/services/GameEngine';

export const MobileGameDirector = () => {
  const { viewport, size } = useThree();
  const engineRef = useRef<GameEngineCore | null>(null);

  useEffect(() => {
    const engine = MobileBootstrapper();
    engineRef.current = engine;
    
    engine.updateViewport(viewport.width, viewport.height, size.width, size.height);

    return () => {
      engine.teardown();
      engineRef.current = null;
    };
  }, []);

  useFrame((state, delta) => {
    if (engineRef.current) {
        engineRef.current.update(delta, state.clock.elapsedTime);
    }
  });

  return null;
};
