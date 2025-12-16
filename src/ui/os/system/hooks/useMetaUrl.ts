import { useEffect, useRef } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';

export const useMetaUrl = (bootLogMessage: string | null) => {
  const { bootState, isSimulationPaused, isBreaching, isZenMode } = useStore();
  const integrity = useGameStore(s => s.systemIntegrity);
  const lastUpdate = useRef(0);

  // 1. Boot Sequence Updates (Immediate)
  useEffect(() => {
    if (bootState === 'standby' && bootLogMessage) {
        const safeMsg = bootLogMessage.replace(/>/g, '').replace(/\./g, '').trim().replace(/ /g, '_');
        window.history.replaceState(null, '', `#/BOOT/${safeMsg}`);
    }
  }, [bootLogMessage, bootState]);

  // 2. Game State Updates (Throttled)
  useEffect(() => {
    const update = () => {
        if (bootState === 'standby') return;

        const now = Date.now();
        if (now - lastUpdate.current < 80) return; // Cap at ~12 updates/sec

        const safeInt = Math.floor(Math.max(0, integrity));
        const isGameOver = safeInt <= 0;
        let hash = '';

        if (isSimulationPaused) {
            hash = '#/SYSTEM_LOCKED/AWAITING_INPUT';
        } else if (bootState === 'sandbox') {
            hash = '#/SIMULATION/HOLO_DECK';
        } else if (isZenMode) {
            hash = '#/ZEN_GARDEN/PEACE_PROTOCOL';
        } else if (isGameOver) {
            hash = '#/STATUS:CRITICAL/SYSTEM_FAILURE';
        } else if (safeInt < 30) {
            // UPDATED: SYS_INT -> OS_INT
            hash = `#/STATUS:CRITICAL/OS_INT:${safeInt}%`;
        } else {
            let status = 'STABLE';
            if (safeInt < 60) status = 'CAUTION';
            // UPDATED: SYS_INT -> OS_INT
            hash = `#/STATUS:${status}/OS_INT:${safeInt}%`;
        }

        if (window.location.hash !== hash) {
            window.history.replaceState(null, '', hash);
        }
        lastUpdate.current = now;
    };

    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [bootState, isSimulationPaused, integrity, isBreaching, isZenMode]);
};
