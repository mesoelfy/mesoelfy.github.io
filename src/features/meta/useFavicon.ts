import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { generateHealthIcon, generateBreachIcon, generateBootIcon, generatePausedIcon } from './faviconGenerator';
import { COLORS } from './metaConstants';

const UPDATE_INTERVAL = 100; // 10 FPS

export const useFavicon = (bootKey: string) => {
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const defaultIconDataRef = useRef<string | null>(null);
  const lastVisualKey = useRef<string>('');
  
  const { bootState, isBreaching, isSimulationPaused } = useStore();
  const integrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  const [tick, setTick] = useState(false);

  // 1. PRE-BAKER (Cache default favicon)
  useEffect(() => {
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
    
    updateFavicon();

    return () => clearInterval(interval);
  }, [tick, bootState, isBreaching, isSimulationPaused, integrity, isZenMode, bootKey]);

  const updateFavicon = () => {
    if (!linkRef.current) return;

    // Blink Logic (1Hz)
    const blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
    
    let nextHref = '';
    let visualKey = '';

    // --- STATE DETERMINATION ---

    if (bootState === 'standby') {
        visualKey = `BOOT_${bootKey}_${blinkOn}`;
        nextHref = generateBootIcon(bootKey, blinkOn);
    } 
    else if (isBreaching) {
        visualKey = `BREACH_${blinkOn ? 'A' : 'B'}`;
        nextHref = generateBreachIcon(blinkOn ? 'A' : 'B');
    } 
    else if (isSimulationPaused) {
        visualKey = `PAUSED_${blinkOn}`;
        nextHref = generatePausedIcon(blinkOn);
    } 
    else if (isZenMode || (integrity > 99)) {
        // If healthy/zen, try to show the original high-res favicon
        if (defaultIconDataRef.current) {
            visualKey = 'DEFAULT_STATIC';
            nextHref = defaultIconDataRef.current;
        } else {
            visualKey = 'HEALTH_100';
            nextHref = generateHealthIcon(100, COLORS.GREEN);
        }
    } 
    else {
        // Dynamic Health Bar
        const safeInt = Math.max(0, integrity);
        const displayInt = Math.floor(safeInt);

        let color = COLORS.GREEN;
        if (displayInt < 30) color = COLORS.RED;
        else if (displayInt < 60) color = COLORS.YELLOW;

        visualKey = `HEALTH_${displayInt}_${color}`;
        nextHref = generateHealthIcon(displayInt, color);
    }

    // --- DOM COMMIT ---
    // Only touch the DOM if the visual key actually changed
    if (visualKey !== lastVisualKey.current && nextHref) {
        linkRef.current.href = nextHref;
        lastVisualKey.current = visualKey;
    }
  };
};
