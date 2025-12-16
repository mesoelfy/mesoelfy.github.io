import { useCallback } from 'react';
import { TransientDOMService } from '@/sys/services/TransientDOMService';

/**
 * Registers a DOM element to the TransientDOMService via a Callback Ref.
 * This ensures registration happens exactly when the element mounts/unmounts,
 * even if it is conditionally rendered.
 */
export const useTransientRef = (id: string, type: 'text' | 'width' | 'css-var') => {
  const setRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      // Element Mounted
      TransientDOMService.register(id, node, type);
    } else {
      // Element Unmounted
      TransientDOMService.unregister(id);
    }
  }, [id, type]);

  return setRef;
};
