import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Registers a DOM element to the store so the GameLoop can write to it directly.
 * Useful for Score, Health, and Timers to avoid React Re-renders.
 */
export const useTransientRef = (id: string, type: 'text' | 'width' | 'css-var') => {
  // We use a generic HTMLSpanElement, but it works for divs too
  const ref = useRef<any>(null);
  const register = useGameStore(s => s.registerTransientElement);
  const unregister = useGameStore(s => s.unregisterTransientElement);

  useEffect(() => {
    if (ref.current) {
      register(id, ref.current, type);
    }
    return () => unregister(id);
  }, [id, type, register, unregister]);

  return ref;
};
