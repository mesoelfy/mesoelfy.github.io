import { MouseEvent as ReactMouseEvent } from 'react';

/**
 * Calculates stereo pan value (-1.0 to 1.0) based on mouse X position.
 * Handles both React Synthetic Events and Native DOM Events.
 */
export const getPan = (e: ReactMouseEvent | MouseEvent | TouchEvent): number => {
  if (typeof window === 'undefined') return 0;
  
  let clientX = 0;
  
  if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
  } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
  } else {
      return 0;
  }

  const width = window.innerWidth;
  if (width === 0) return 0;

  // Normalize: 0 to 1
  const normalized = clientX / width;
  
  // Map: -1 to 1
  const pan = (normalized * 2) - 1;
  
  // Clamp for safety
  return Math.max(-1, Math.min(1, pan));
};
