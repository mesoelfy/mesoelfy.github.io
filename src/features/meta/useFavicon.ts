import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { generateHealthIcon, generateBreachIcon, generateBootIcon, generatePausedIcon } from './faviconGenerator';
import { COLORS } from './metaConstants';

// UPDATED: 100ms (10 FPS)
const UPDATE_INTERVAL = 100; 

export const useFavicon = (bootKey: string) => {
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const defaultIconDataRef = useRef<string | null>(null);
  const lastVisualKey = useRef<string>('');
  
  const { bootState, isBreaching, isSimulationPaused } = useStore();
  const integrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  const [tick, setTick] = useState(false);

  // 1. PRE-BAKER
  useEffect(() => {
    // Ensure link exists
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    linkRef.current = link;

    fetch('/favicon.ico')
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            defaultIconDataRef.current = reader.result;
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, []);

  // 2. UPDATE LOOP
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => !t); 
      updateFavicon();
    }, UPDATE_INTERVAL);
    
    // Immediate check on key state changes
    updateFavicon();

    return () => clearInterval(interval);
  }, [tick, bootState, isBreaching, isSimulationPaused, integrity, isZenMode, bootKey]);

  const updateFavicon = () => {
    if (!linkRef.current) return;

    let nextHref = '';
    let visualKey = '';

    // --- STATE MACHINE ---

    // 1. BOOT SEQUENCE (Highest Priority during Standby)
    if (bootState === 'standby') {
        let stage = 'INIT';
        if (bootKey === 'LINK') stage = 'LINK';
        else if (bootKey === 'MOUNT') stage = 'MOUNT';
        else if (bootKey === 'UNSAFE') stage = 'UNSAFE';
        else if (bootKey === 'BYPASS') stage = 'BYPASS';
        else if (bootKey === 'DECRYPTED') stage = 'DECRYPTED';
        else if (bootKey === 'CAUTION') stage = 'CAUTION';
        
        visualKey = `BOOT_${stage}_${tick}`;
        nextHref = generateBootIcon(stage, tick);
    }
    // 2. BREACHING (During active game)
    else if (isBreaching) {
        visualKey = `BREACH_${tick ? 'A' : 'B'}`;
        nextHref = generateBreachIcon(tick ? 'A' : 'B');
    }
    // 3. PAUSED
    else if (isSimulationPaused) {
        visualKey = `PAUSED_${tick}`;
        nextHref = generatePausedIcon(tick);
    }
    // 4. IDLE / HEALTHY (Use Custom Art)
    else if (isZenMode || (integrity > 99)) {
        if (defaultIconDataRef.current) {
            visualKey = 'DEFAULT_STATIC';
            nextHref = defaultIconDataRef.current;
        } else {
            visualKey = 'HEALTH_100';
            nextHref = generateHealthIcon(100, COLORS.GREEN);
        }
    }
    // 5. DAMAGED / ACTIVE
    else {
        const safeInt = Math.max(0, integrity);
        const displayInt = Math.floor(safeInt);

        let color = COLORS.GREEN;
        if (displayInt < 30) color = COLORS.RED;
        else if (displayInt < 60) color = COLORS.YELLOW;

        visualKey = `HEALTH_${displayInt}_${color}`;
        nextHref = generateHealthIcon(displayInt, color);
    }

    // --- COMMIT ---
    if (visualKey !== lastVisualKey.current && nextHref) {
        linkRef.current.href = nextHref;
        lastVisualKey.current = visualKey;
    }
  };
};
