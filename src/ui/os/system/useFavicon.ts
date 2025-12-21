import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { generateHealthIcon, generateBreachIcon, generateBootIcon, generatePausedIcon } from './faviconGenerator';
import { COLORS } from './metaConstants';
import { EXTERNAL_CONFIG } from '@/engine/config/ExternalConfig';

const UPDATE_INTERVAL = 500; 

export const useFavicon = (bootKey: string) => {
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const defaultIconDataRef = useRef<string | null>(null);
  const lastVisualKey = useRef<string>('');
  const { bootState, isBreaching, isSimulationPaused } = useStore();
  const integrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) { 
        link = document.createElement('link'); 
        link.rel = 'icon'; 
        document.head.appendChild(link); 
    }
    linkRef.current = link;

    fetch(EXTERNAL_CONFIG.ASSETS.ICONS.FAVICON).then(res => res.blob()).then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => { if (typeof reader.result === 'string') defaultIconDataRef.current = reader.result; };
        reader.readAsDataURL(blob);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) return;
    const interval = setInterval(() => { setTick(t => !t); }, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!linkRef.current) return;
    
    const displayInt = Math.floor(Math.max(0, integrity));
    const statusColor = displayInt < 30 ? COLORS.RED : (displayInt < 60 ? COLORS.YELLOW : COLORS.GREEN);

    let nextHref = ''; 
    let visualKey = '';

    if (bootState === 'standby') { 
        visualKey = `BOOT_${bootKey}_${tick}`; 
        nextHref = generateBootIcon(bootKey, tick); 
    } 
    else if (isBreaching) { 
        visualKey = `BREACH_${tick ? 'A' : 'B'}`; 
        nextHref = generateBreachIcon(tick ? 'A' : 'B'); 
    } 
    else if (isSimulationPaused) { 
        visualKey = `PAUSED_${tick}_${statusColor}`; 
        nextHref = generatePausedIcon(tick, statusColor); 
    } 
    else if (isZenMode || integrity > 99) {
        if (defaultIconDataRef.current) { 
            visualKey = 'DEFAULT_STATIC'; 
            nextHref = defaultIconDataRef.current; 
        } else { 
            visualKey = 'HEALTH_100'; 
            nextHref = generateHealthIcon(100, COLORS.GREEN); 
        }
    } 
    else { 
        visualKey = `HEALTH_${displayInt}_${statusColor}`; 
        nextHref = generateHealthIcon(displayInt, statusColor); 
    }

    if (visualKey !== lastVisualKey.current && nextHref) { 
        linkRef.current.href = nextHref; 
        lastVisualKey.current = visualKey; 
    }
  }, [tick, bootState, isBreaching, isSimulationPaused, integrity, isZenMode, bootKey]);
};
