import { useCallback } from 'react';
import { TransientDOMService } from '@/engine/services/TransientDOMService';

type UpdateType = 'text' | 'width' | 'css-var';

export const useMultiTransientRef = (configs: { id: string, type: UpdateType }[]) => {
  const setRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      configs.forEach(c => TransientDOMService.register(c.id, node, c.type));
    } else {
      configs.forEach(c => TransientDOMService.unregister(c.id));
    }
  }, [configs]); // Configs should be memoized or static

  return setRef;
};
