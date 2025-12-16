import { useEffect } from 'react';
import { useStore } from '@/game/state/global/useStore';

/**
 * Handles Global Window Focus/Blur events to pause/resume the simulation.
 */
export const useWindowFocus = () => {
  const { bootState, setSimulationPaused } = useStore();

  useEffect(() => {
    // Only attach listeners if the game is actually active
    if (bootState !== 'active') return;

    const handlePause = () => setSimulationPaused(true);
    const handleResume = () => setSimulationPaused(false);
    
    // 1. Visibility API (Tab switching)
    const handleVisibility = () => {
        if (document.hidden) handlePause();
        else handleResume();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    
    // 2. Focus API (Window clicking)
    window.addEventListener('blur', handlePause);
    window.addEventListener('focus', handleResume);
    
    // 3. Mouse leaving viewport (Optional, strict immersion)
    document.addEventListener('mouseleave', handlePause);
    document.addEventListener('mouseenter', handleResume);
    
    return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('blur', handlePause);
        window.removeEventListener('focus', handleResume);
        document.removeEventListener('mouseleave', handlePause);
        document.removeEventListener('mouseenter', handleResume);
    };
  }, [bootState, setSimulationPaused]);
};
