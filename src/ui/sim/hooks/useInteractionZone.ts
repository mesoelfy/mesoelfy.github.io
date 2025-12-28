import { useEffect, useRef } from 'react';
import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { IInteractionSystem } from '@/engine/interfaces';
import { ViewportHelper } from '@/engine/math/ViewportHelper';

export const useInteractionZone = (id: string) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    let sys: IInteractionSystem | undefined;
    let registered = false;

    // Polling logic to wait for engine init
    const attemptReg = () => {
        try {
            sys = ServiceLocator.getSystem<IInteractionSystem>('InteractionSystem');
            if (sys) {
                const rect = el.getBoundingClientRect();
                const worldRect = ViewportHelper.domToWorld(id, rect);
                sys.registerZone(id, worldRect);
                registered = true;
            }
        } catch {}
    };

    const interval = setInterval(() => {
        if (!registered) attemptReg();
    }, 100);

    const observer = new ResizeObserver(() => {
        if (sys) {
            const rect = el.getBoundingClientRect();
            const worldRect = ViewportHelper.domToWorld(id, rect);
            sys.registerZone(id, worldRect);
        }
    });
    observer.observe(el);

    // Initial attempt
    attemptReg();

    return () => {
        clearInterval(interval);
        observer.disconnect();
        if (sys) sys.unregisterZone(id);
    };
  }, [id]);

  return elementRef;
};
