'use client';

import { useEffect, useRef } from 'react';

/**
 * Registers the Service Worker and handles lifecycle updates.
 * Forces a page reload when a new Service Worker takes control.
 */
export const PWARegister = () => {
  const refreshing = useRef(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.hostname !== 'localhost'
    ) {
      // 1. Register
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // 2. Force an update check immediately on load
        reg.update();
        console.log('// PWA: REGISTERED', reg.scope);
      });

      // 3. Listen for the "controlling" event (when new SW takes over)
      // This happens after self.clients.claim() in the SW
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing.current) {
          refreshing.current = true;
          console.log('// PWA: CONTROLLER CHANGED - RELOADING...');
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
};
