import { useEffect } from 'react';
import { useStore } from '@/engine/state/global/useStore';

/**
 * Handles Global Window Focus/Blur events to pause/resume the simulation.
 * INTELLIGENT RESUME: Only resumes if no Modals/Debug menus are active.
 */
export const useWindowFocus = () => {
  const { bootState, setSimulationPaused } = useStore();

  useEffect(() => {
    // Only attach listeners if the game is actually active
    if (bootState !== 'active') return;

    const handlePause = () => setSimulationPaused(true);
    
    const handleResume = () => {
        // CRITICAL FIX: Check if we are in a menu before resuming the sim
        // We access getState() directly to ensure we have the fresh value inside the closure
        const state = useStore.getState();
        const isMenuOpen = state.activeModal !== 'none';
        const isDebugBlocking = state.isDebugOpen && !state.isDebugMinimized;
        
        // Only resume if the UI is actually clear
        if (!isMenuOpen && !isDebugBlocking) {
            setSimulationPaused(false);
        }
    };
    
    // 1. Visibility API (Tab switching)
    const handleVisibility = () => {
        if (document.hidden) handlePause();
        else handleResume();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    
    // 2. Focus API (Window clicking)
    window.addEventListener('blur', handlePause);
    window.addEventListener('focus', handleResume);
    
    // 3. Mouse leaving viewport (Strict immersion)
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
