import { useEffect, useRef } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

export const MetaManager = () => {
  const bootState = useStore(state => state.bootState);
  const isZenMode = useGameStore(state => state.isZenMode);
  
  // Refs for throttling logic
  const lastHashUpdate = useRef(0);

  // --- 1. CONSOLE IDENTITY (SAFE ASCII) ---
  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    
    // We trim the first newline to ensure alignment starts immediately
    const cleanAscii = ASCII_CONSOLE.replace(/^\n/, '');
    
    console.log(`%c${cleanAscii}\n// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.`, CONSOLE_STYLE);
    (window as any).hasLoggedIdentity = true;
  }, []);

  // --- 2. BOOT LOG SYNC ---
  useEffect(() => {
    const unsub = GameEventBus.subscribe(GameEvents.BOOT_LOG, (p) => {
        // Sanitize for URL
        const safeMsg = p.message
            .replace(/>/g, '')        // Remove >
            .replace(/\./g, '')       // Remove dots
            .trim()
            .replace(/ /g, '_');      // Spaces to underscores
        
        window.history.replaceState(null, '', `#/BOOT/${safeMsg}`);
    });
    return unsub;
  }, []);

  // --- 3. GAMEPLAY URL LOOP ---
  useEffect(() => {
    const updateHash = () => {
      const now = Date.now();
      if (now - lastHashUpdate.current < 500) return; // Throttle 500ms
      lastHashUpdate.current = now;

      let hash = '';
      const state = useStore.getState();
      const gameState = useGameStore.getState();
      const integrity = gameState.systemIntegrity;

      // Boot is handled by Event Listener above (Phase 2), so we skip it here
      if (state.bootState === 'standby') {
          return; 
      } 
      
      if (state.bootState === 'sandbox') {
          hash = '#/SIMULATION/HOLO_DECK';
      } else if (gameState.isZenMode) {
          hash = '#/ZEN_GARDEN/PEACE_PROTOCOL';
      } else if (integrity <= 0) {
          hash = '#/STATUS:CRITICAL/SYSTEM_FAILURE';
      } else if (integrity < 30) {
          // FLIPPED ORDER: STATUS FIRST
          hash = `#/STATUS:CRITICAL/SYS_INT:${Math.floor(integrity)}%`;
      } else {
          // Healthy / Caution States
          const int = Math.floor(integrity);
          let status = 'STABLE';
          
          if (integrity < 60) {
              status = 'CAUTION'; // Yellow State
          }
          
          hash = `#/STATUS:${status}/SYS_INT:${int}%`;
      }

      if (window.location.hash !== hash) {
          window.history.replaceState(null, '', hash);
      }
    };

    // Run loop
    const interval = setInterval(updateHash, 500);

    return () => clearInterval(interval);
  }, [bootState, isZenMode]);

  return null; // Headless component
};

declare global {
  interface Window {
    hasLoggedIdentity?: boolean;
  }
}
