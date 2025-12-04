import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export const usePanelRegistry = (id: string) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const registerPanel = useGameStore((state) => state.registerPanel);
  const updatePanelRect = useGameStore((state) => state.updatePanelRect);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // 1. Initial Registration
    const rect = el.getBoundingClientRect();
    registerPanel(id, rect);

    // 2. Resize Observer (Updates position if window changes)
    const observer = new ResizeObserver(() => {
      const updatedRect = el.getBoundingClientRect();
      updatePanelRect(id, updatedRect);
    });

    observer.observe(el);
    // Also observe document body for layout shifts
    observer.observe(document.body);

    return () => {
      observer.disconnect();
    };
  }, [id, registerPanel, updatePanelRect]);

  return elementRef;
};
