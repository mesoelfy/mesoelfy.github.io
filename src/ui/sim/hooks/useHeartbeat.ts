import { useEffect } from 'react';
import { useAnimation, AnimationControls } from 'framer-motion';
import { GameEventBus } from '@/core/signals/GameEventBus';
import { GameEvents } from '@/core/signals/GameEvents';

export const useHeartbeat = (): AnimationControls => {
  const controls = useAnimation();

  useEffect(() => {
    const unsub = GameEventBus.subscribe(GameEvents.HEARTBEAT, (payload) => {
        // We trigger the 'heartbeat' variant defined in the component.
        // We pass the urgency as a 'custom' prop to the variant if needed.
        controls.start("heartbeat");
    });

    return () => unsub();
  }, [controls]);

  return controls;
};
