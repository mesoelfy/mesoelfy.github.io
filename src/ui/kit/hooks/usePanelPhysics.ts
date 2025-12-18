import { useEffect, useRef } from 'react';
import { useGameContext } from '@/engine/state/GameContext';
import { GameEvents } from '@/engine/signals/GameEvents';

// Tweakables
const STRESS_ADD = 0.5; // Slightly reduced per-hit so 1 driller isn't too crazy
const MAX_STRESS = 3.0; // NEW: Cap allows "Overdrive" shaking for swarms
const STRESS_DECAY = 0.9; 
const JITTER_SCALE = 3.0; // Base pixel multiplier

export const usePanelPhysics = (panelId: string, domRef: React.RefObject<HTMLElement>) => {
  const { events } = useGameContext();
  
  const physics = useRef({
    stress: 0,
    recoilX: 0,
    recoilY: 0
  });
  
  const frameId = useRef<number>(0);

  useEffect(() => {
    // 1. Event Listener
    const unsub = events.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
        if (p.id !== panelId) return;
        
        // Add Stress (Stacking)
        // Allows multiple enemies to push stress well beyond 1.0
        physics.current.stress = Math.min(MAX_STRESS, physics.current.stress + STRESS_ADD);
    });

    // 2. Physics Loop
    const loop = () => {
        const p = physics.current;
        
        if (p.stress > 0.01) {
            // Decay
            p.stress *= STRESS_DECAY;
            if (p.stress < 0.01) p.stress = 0;

            // Calculate Jitter
            // The more stress, the wider the range
            const currentScale = JITTER_SCALE * p.stress;
            
            const jx = (Math.random() - 0.5) * currentScale;
            const jy = (Math.random() - 0.5) * currentScale;
            
            // Apply
            if (domRef.current) {
                domRef.current.style.transform = `translate(${jx.toFixed(1)}px, ${jy.toFixed(1)}px)`;
            }
        } else {
            // Reset if idle
            if (domRef.current && domRef.current.style.transform !== 'none') {
                domRef.current.style.transform = 'none';
            }
        }

        frameId.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
        unsub();
        cancelAnimationFrame(frameId.current);
    };
  }, [panelId, events]);
};
