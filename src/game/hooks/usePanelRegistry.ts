import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export const usePanelRegistry = (id: string) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const registerPanel = useGameStore((state) => state.registerPanel);
  const unregisterPanel = useGameStore((state) => state.unregisterPanel);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Register the live DOM element
    registerPanel(id, el);

    return () => {
      unregisterPanel(id);
    };
  }, [id, registerPanel, unregisterPanel]);

  return elementRef;
};
