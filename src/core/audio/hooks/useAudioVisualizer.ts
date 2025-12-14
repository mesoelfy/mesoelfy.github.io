import { useEffect, useRef } from 'react';
import { AudioSystem } from '../AudioSystem';

/**
 * Hooks into the AnalyserNode and returns a ref to the data buffer.
 * It does NOT trigger re-renders. Use requestAnimationFrame in your component to read it.
 */
export const useAudioVisualizer = (fftSize: number = 32) => {
  const dataRef = useRef(new Uint8Array(fftSize));
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    
    const loop = () => {
      if (!active.current) return;
      AudioSystem.getFrequencyData(dataRef.current);
      requestAnimationFrame(loop);
    };
    
    loop();

    return () => {
      active.current = false;
    };
  }, []);

  // Return the buffer itself so components can read it
  return dataRef;
};
