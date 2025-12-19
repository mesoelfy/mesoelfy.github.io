import { useEffect, useRef } from 'react';
import { useGameContext } from '@/engine/state/GameContext';
import { GameEvents } from '@/engine/signals/GameEvents';

// Tweakables
const STRESS_ADD = 0.5;
const MAX_STRESS = 3.0; 
const STRESS_DECAY = 0.9; 
const JITTER_SCALE = 3.0; 

export const usePanelPhysics = (
    panelId: string, 
    visualRef: React.RefObject<HTMLElement>,
    isActive: boolean
) => {
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
        physics.current.stress = Math.min(MAX_STRESS, physics.current.stress + STRESS_ADD);
    });

    // 2. Physics Loop
    const loop = () => {
        if (!visualRef.current) return;

        // If inactive (Game Over), stop fighting Framer Motion
        if (!isActive) {
            // Ensure we reset visually if we were stressed
            if (physics.current.stress > 0) {
                visualRef.current.style.transform = 'none';
                physics.current.stress = 0;
            }
            return;
        }

        const p = physics.current;
        
        if (p.stress > 0.01) {
            // Decay
            p.stress *= STRESS_DECAY;
            if (p.stress < 0.01) p.stress = 0;

            // Calculate Jitter
            const currentScale = JITTER_SCALE * p.stress;
            const jx = (Math.random() - 0.5) * currentScale;
            const jy = (Math.random() - 0.5) * currentScale;
            
            // Apply to VISUAL layer only
            visualRef.current.style.transform = `translate3d(${jx.toFixed(1)}px, ${jy.toFixed(1)}px, 0)`;
        } else {
            // Reset if idle
            if (visualRef.current.style.transform !== 'none') {
                visualRef.current.style.transform = 'none';
            }
        }

        frameId.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
        unsub();
        cancelAnimationFrame(frameId.current);
    };
  }, [panelId, events, isActive, visualRef]);
};
