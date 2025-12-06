import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { PanelRegistry } from '../systems/PanelRegistrySystem';

export const usePanelRegistry = (id: string) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  const registerPanel = useGameStore((state) => state.registerPanel);
  const unregisterPanel = useGameStore((state) => state.unregisterPanel);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // 1. Register Logic (Health/Store)
    registerPanel(id, el);

    // 2. Register Spatial (Singleton)
    // This works immediately, even if game hasn't started
    PanelRegistry.register(id, el);

    // 3. Resize Observer
    const observer = new ResizeObserver(() => {
        PanelRegistry.refreshSingle(id);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      unregisterPanel(id);
      PanelRegistry.unregister(id);
    };
  }, [id, registerPanel, unregisterPanel]);

  return elementRef;
};
