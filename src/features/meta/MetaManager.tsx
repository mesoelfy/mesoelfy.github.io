import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { useFavicon } from './useFavicon';
import { COLORS } from './metaConstants';

const BOOT_KEYS: Record<string, string> = {
    "INITIALIZE NEURAL_LACE": "INIT",
    "CONNECTED TO LATENT_SPACE": "LINK",
    "MOUNT MESOELFY_CORE": "MOUNT",
    "UNSAFE CONNECTION DETECTED": "UNSAFE",
    "BYPASSING SENTINEL_NODES": "BYPASS",
    "DECRYPTED": "DECRYPTED",
    "PROCEED WITH CAUTION": "CAUTION",
};

export const MetaManager = () => {
  const [bootKey, setBootKey] = useState('INIT');
  
  // Hook handles visual updates based on state
  useFavicon(bootKey);

  const { bootState, isSimulationPaused, setSimulationPaused, isBreaching } = useStore();
  const integrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  const lastHashUpdate = useRef(0);
  const metaThemeRef = useRef<HTMLMetaElement | null>(null);

  // 1. CONSOLE IDENTITY
  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    const cleanAscii = ASCII_CONSOLE.replace(/^\n/, '');
    console.log(`%c${cleanAscii}\n// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.`, CONSOLE_STYLE);
    (window as any).hasLoggedIdentity = true;
  }, []);

  // 2. AUTO-PAUSE LISTENERS (Fixed)
  useEffect(() => {
    if (bootState !== 'active') return;

    const handlePause = () => setSimulationPaused(true);
    const handleResume = () => setSimulationPaused(false);
    
    // Visibility API (Tabs switching)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) handlePause();
        else handleResume();
    });

    // Window Focus (Clicking outside)
    window.addEventListener('blur', handlePause);
    window.addEventListener('focus', handleResume);

    // Mouse Leaving Viewport (Top/Bottom)
    document.addEventListener('mouseleave', handlePause);
    document.addEventListener('mouseenter', handleResume);
    
    return () => {
        window.removeEventListener('blur', handlePause);
        window.removeEventListener('focus', handleResume);
        document.removeEventListener('mouseleave', handlePause);
        document.removeEventListener('mouseenter', handleResume);
    };
  }, [bootState, setSimulationPaused]);

  // 3. BOOT SEQUENCE SYNC
  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.BOOT_LOG, (p) => {
          let currentKey = 'INIT';
          for (const k in BOOT_KEYS) {
              if (p.message.includes(k)) {
                  currentKey = BOOT_KEYS[k];
                  break;
              }
          }
          setBootKey(currentKey);

          const safeMsg = p.message.replace(/>/g, '').replace(/\./g, '').trim().replace(/ /g, '_');
          window.history.replaceState(null, '', `#/BOOT/${safeMsg}`);
          
          document.title = `[ :: // ${currentKey} // :: ]`;
      });
      return unsub;
  }, []);

  // 4. METADATA LOOP
  useEffect(() => {
      // Lazy init meta tag
      let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
      if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'theme-color';
          document.head.appendChild(meta);
      }
      metaThemeRef.current = meta;

      const updateMeta = () => {
          // Calculate safe derived state
          const isBoot = bootState === 'standby';
          const isGameOver = integrity <= 0;
          const safeInt = Math.floor(Math.max(0, integrity));

          // A. URL HASH
          const now = Date.now();
          if (!isBoot && now - lastHashUpdate.current > 500) {
              let hash = '';
              if (isSimulationPaused) hash = '#/SYSTEM_LOCKED/AWAITING_INPUT';
              else if (bootState === 'sandbox') hash = '#/SIMULATION/HOLO_DECK';
              else if (isZenMode) hash = '#/ZEN_GARDEN/PEACE_PROTOCOL';
              else if (isGameOver) hash = '#/STATUS:CRITICAL/SYSTEM_FAILURE';
              else if (safeInt < 30) hash = `#/STATUS:CRITICAL/SYS_INT:${safeInt}%`;
              else {
                  let status = 'STABLE';
                  if (safeInt < 60) status = 'CAUTION';
                  hash = `#/STATUS:${status}/SYS_INT:${safeInt}%`;
              }
              
              if (window.location.hash !== hash) {
                  window.history.replaceState(null, '', hash);
              }
              lastHashUpdate.current = now;
          }

          // B. THEME COLOR
          let themeHex = COLORS.BLACK;
          if (!isBoot && !isSimulationPaused && !isGameOver) {
              if (safeInt < 30) themeHex = COLORS.RED;      
              else if (safeInt < 60) themeHex = COLORS.YELLOW; 
          }
          if (metaThemeRef.current && metaThemeRef.current.content !== themeHex) {
              metaThemeRef.current.content = themeHex;
          }

          // C. TITLE (Boot handles its own title in the event listener)
          if (isBoot) return;

          let title = "";
          const tick = Math.floor(Date.now() / 500) % 2 === 0;

          if (isGameOver) title = `[ :: SESSION FAILURE :: ]`;
          else if (isSimulationPaused) title = `[ :: SYSTEM PAUSED :: ]`;
          else if (safeInt >= 99 && !isBreaching) title = "[ :: // MESOELFY // :: ]";
          else {
              // Ascii Bar
              let bar = "";
              const activeIndex = Math.floor(safeInt / 10);
              for(let i=0; i<10; i++) {
                  if (i < activeIndex) bar += "▮";
                  else if (i === activeIndex && safeInt > 0) bar += tick ? "▮" : "▯";
                  else bar += "▯";
              }
              title = `[ ${bar} INT: ${safeInt}% ]`;
          }
          
          if (document.title !== title) document.title = title;
      };

      const interval = setInterval(updateMeta, 500); 
      return () => clearInterval(interval);

  }, [bootState, isSimulationPaused, integrity, isBreaching, isZenMode]);

  return null;
};

declare global {
  interface Window {
    hasLoggedIdentity?: boolean;
  }
}
