import { useEffect } from 'react';
import { useAnimation } from 'framer-motion';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

export const useHeartbeat = () => {
  const controls = useAnimation();

  useEffect(() => {
    const unsub = GameEventBus.subscribe(GameEvents.HEARTBEAT, (payload) => {
        // Trigger a single beat
        // Urgency (0-1) can control intensity
        const intensity = 1.0 + (payload.urgency * 0.2); // 1.0 to 1.2 scale
        const colorIntensity = payload.urgency; // 0 to 1 opacity/color mix

        controls.start({
            scale: [1, intensity, 1],
            textShadow: [
                "0 0 0px #FF003C",
                `0 0 ${20 * intensity}px #FF003C`,
                "0 0 0px #FF003C"
            ],
            transition: { duration: 0.2, ease: "easeOut" }
        });
    });

    return () => unsub();
  }, [controls]);

  return controls;
};
