import { useEffect, useRef } from 'react';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { CameraSystem } from '@/game/systems/CameraSystem';

export const GlobalShakeManager = () => {
  const requestRef = useRef<number>();
  
  useEffect(() => {
    const animate = () => {
      // 1. Get Shake from the authoritative Game System
      let x = 0, y = 0, r = 0;
      try {
          const sys = ServiceLocator.getSystem<CameraSystem>('CameraSystem');
          const shake = sys.getShake();
          x = shake.x;
          y = shake.y;
          r = shake.r;
      } catch {
          // System not ready
      }

      // 2. Apply to HTML Root
      const root = document.getElementById('global-app-root');
      if (root) {
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
          // Convert rotation radians to degrees for CSS
          const deg = r * (180 / Math.PI);
          // Scale pixels up slightly so HTML moves perceptibly (since World Units are small)
          const pixelScale = 20; 
          root.style.transform = `translate(${x * pixelScale}px, ${y * pixelScale}px) rotate(${deg}deg)`;
        } else {
          root.style.transform = '';
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  return null;
};
