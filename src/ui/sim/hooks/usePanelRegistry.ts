import { useEffect, useRef } from 'react';
import { useGameStore } from '@/sys/state/game/useGameStore';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import { IPanelSystem } from '@/engine/interfaces';

export const usePanelRegistry = (id: string) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  const registerPanel = useGameStore((state) => state.registerPanel);
  const unregisterPanel = useGameStore((state) => state.unregisterPanel);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // 1. React State Registration (Immediate)
    registerPanel(id, el);

    // 2. Engine System Registration (With Retry)
    let panelSys: IPanelSystem | undefined;
    let registered = false;
    
    const attemptRegistration = () => {
        if (registered) return;
        try {
            panelSys = ServiceLocator.getSystem<IPanelSystem>('PanelRegistrySystem');
            if (panelSys) {
                panelSys.register(id, el);
                registered = true;
                // Force a refresh immediately
                panelSys.refreshSingle(id);
            }
        } catch (e) {
            // Engine not ready, wait for next attempt
        }
    };

    // Attempt immediately
    attemptRegistration();

    // Poll until registered (needed because Engine boots async relative to React mount)
    const retryInterval = setInterval(() => {
        if (registered) {
            clearInterval(retryInterval);
        } else {
            attemptRegistration();
        }
    }, 100);

    // 3. Resize Observer
    const observer = new ResizeObserver(() => {
        try {
            // Try getting system fresh in case of HMR/Reload
            if (!panelSys) panelSys = ServiceLocator.getSystem<IPanelSystem>('PanelRegistrySystem');
            if (panelSys) panelSys.refreshSingle(id);
        } catch {}
    });
    observer.observe(el);

    return () => {
      clearInterval(retryInterval);
      observer.disconnect();
      unregisterPanel(id);
      try {
          if (panelSys) panelSys.unregister(id);
      } catch {}
    };
  }, [id, registerPanel, unregisterPanel]);

  return elementRef;
};
