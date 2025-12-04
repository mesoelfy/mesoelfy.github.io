import { useEffect, useRef } from 'react';
import { FXManager } from '@/game/systems/FXManager';

export const GlobalShakeManager = () => {
  const requestRef = useRef<number>();
  
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // 1. Process Decay Logic
      FXManager.decay(delta);
      const trauma = FXManager.trauma;

      // 2. Apply to Global Root
      const root = document.getElementById('global-app-root');
      
      if (root) {
        if (trauma > 0) {
          const shake = trauma * trauma;
          const maxAngle = 1.0; // Degrees
          const maxOffset = 10; // Pixels (Increased for visible HTML shake)
          
          const x = maxOffset * shake * (Math.random() * 2 - 1);
          const y = maxOffset * shake * (Math.random() * 2 - 1);
          const rot = maxAngle * shake * (Math.random() * 2 - 1);
          
          root.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
        } else {
          // Optimization: Clear transform when idle
          if (root.style.transform !== '') {
             root.style.transform = '';
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  return null;
};
