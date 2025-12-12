import { useEffect } from 'react';

export const useSmartScroll = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if horizontal scroll is active (content > viewport)
      const hasHorizontalOverflow = el.scrollWidth > el.clientWidth;
      
      // If no horizontal overflow, do nothing (default vertical scroll behavior)
      if (!hasHorizontalOverflow) return;

      // Map vertical delta to horizontal scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          const oldScroll = el.scrollLeft;
          el.scrollLeft += e.deltaY;
          const newScroll = el.scrollLeft;

          // Smart Logic:
          // If the scroll position changed, it means we successfully scrolled horizontally.
          // In that case, prevent default vertical scroll.
          // If we hit the edge (old == new), allow default vertical scroll to happen.
          if (oldScroll !== newScroll) {
              e.preventDefault();
          }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef]);
};
