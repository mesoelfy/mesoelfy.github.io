'use client';

import { useEffect } from 'react';

/**
 * Registers the Service Worker to enable PWA capabilities.
 * This enables the 'Add to Home Screen' prompt on mobile/desktop.
 */
export const PWARegister = () => {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.hostname !== 'localhost' // Optional: skip on localhost to avoid caching issues during dev
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('// PWA SERVICE_WORKER: ONLINE', reg.scope))
        .catch((err) => console.error('// PWA SERVICE_WORKER: FAILED', err));
    }
  }, []);

  return null;
};
