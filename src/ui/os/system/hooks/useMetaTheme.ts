import { useEffect, useRef } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { COLORS } from '../metaConstants';

export const useMetaTheme = () => {
  const metaRef = useRef<HTMLMetaElement | null>(null);
  const { bootState, isSimulationPaused } = useStore();
  const integrity = useGameStore(s => s.systemIntegrity);

  // Ensure meta tag exists on mount
  useEffect(() => {
    let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    }
    metaRef.current = meta;
  }, []);

  useEffect(() => {
    if (!metaRef.current) return;

    let themeHex = COLORS.BLACK;
    const safeInt = Math.max(0, integrity);

    if (bootState !== 'standby' && !isSimulationPaused && safeInt > 0) {
        if (safeInt < 30) themeHex = COLORS.RED;      
        else if (safeInt < 60) themeHex = COLORS.YELLOW; 
    }

    if (metaRef.current.content !== themeHex) {
        metaRef.current.content = themeHex;
    }
  }, [bootState, isSimulationPaused, integrity]);
};
