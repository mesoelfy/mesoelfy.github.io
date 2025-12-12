import { useEffect, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';

export const useMetaTitle = (bootKey: string) => {
  const { bootState, isSimulationPaused, isBreaching } = useStore();
  const integrity = useGameStore(s => s.systemIntegrity);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    // 500ms ticker for blinking effects
    const interval = setInterval(() => setTick(t => !t), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let title = "";
    
    if (bootState === 'standby') {
        title = `[ :: // ${bootKey} // :: ]`;
    } else if (isSimulationPaused) {
        title = `[ :: SYSTEM PAUSED :: ]`;
    } else {
        const safeInt = Math.floor(Math.max(0, integrity));
        
        if (safeInt <= 0) {
            // UPDATED: SESSION -> SYSTEM
            title = `[ :: SYSTEM FAILURE :: ]`;
        } else if (safeInt >= 99 && !isBreaching) {
            title = "[ :: // MESOELFY // :: ]";
        } else {
            // ASCII Health Bar
            let bar = "";
            const activeIndex = Math.floor(safeInt / 10);
            for(let i=0; i<10; i++) {
                if (i < activeIndex) bar += "▮";
                else if (i === activeIndex) bar += tick ? "▮" : "▯";
                else bar += "▯";
            }
            title = `[ ${bar} INT: ${safeInt}% ]`;
        }
    }

    if (document.title !== title) document.title = title;
  }, [tick, bootState, bootKey, isSimulationPaused, integrity, isBreaching]);
};
