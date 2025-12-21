import { useEffect, useRef } from 'react';
import { PanelId } from '@/engine/config/PanelConfig';
import { PanelElementRegistry } from '../registry/PanelElementRegistry';

export const usePanelTracker = (id: PanelId) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      PanelElementRegistry.register(id, elementRef.current);
    }

    return () => {
      PanelElementRegistry.unregister(id);
    };
  }, [id]);

  return elementRef;
};
