import { useEffect } from 'react';
import { useAnimation, AnimationControls } from 'framer-motion';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { useStore } from '@/engine/state/global/useStore';

export const useHeartbeat = (): AnimationControls => {
  const controls = useAnimation();
  // We track sessionId and bootState to ensure we re-subscribe 
  // if the EngineFactory replaces the EventBus instance (e.g. on game reset or boot)
  const { sessionId, bootState } = useStore();

  useEffect(() => {
    const unsub = GameEventBus.subscribe(GameEvents.HEARTBEAT, (payload) => {
        // We trigger the 'heartbeat' variant defined in the component.
        // We pass the urgency as a 'custom' prop to the variant if needed.
        controls.start("heartbeat");
    });

    return () => unsub();
  }, [controls, sessionId, bootState]);

  return controls;
};
