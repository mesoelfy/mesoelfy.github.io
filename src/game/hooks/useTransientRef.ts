import { useEffect, useRef } from 'react';
import { TransientDOMService } from '@/game/services/TransientDOMService';

/**
 * Registers a DOM element to the TransientDOMService.
 * Allows the GameLoop to write to it directly without React Re-renders.
 */
export const useTransientRef = (id: string, type: 'text' | 'width' | 'css-var') => {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current) {
      TransientDOMService.register(id, ref.current, type);
    }
    return () => {
      TransientDOMService.unregister(id);
    };
  }, [id, type]);

  return ref;
};
