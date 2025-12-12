import { useState, useEffect, useRef } from 'react';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { LOG_DATA } from '../data/bootLogs';

interface UseBootSequenceProps {
  onComplete: () => void;
  onBreachStart: () => void;
}

export const useBootSequence = ({ onComplete, onBreachStart }: UseBootSequenceProps) => {
  const [step, setStep] = useState(0); 
  const [isBreaching, setIsBreaching] = useState(false);
  const [showGpuPanel, setShowGpuPanel] = useState(false); 

  // Emit Logs to Global Event Bus (for MetaManager)
  useEffect(() => {
    if (LOG_DATA[step]) {
        GameEventBus.emit(GameEvents.BOOT_LOG, { message: LOG_DATA[step].text });
    }
    
    // Trigger GPU Panel Delay at step 6
    if (step >= 6 && !showGpuPanel) {
        const timer = setTimeout(() => {
            setShowGpuPanel(true);
            AudioSystem.playSound('ui_menu_open');
        }, 1000); 
        return () => clearTimeout(timer);
    }
  }, [step, showGpuPanel]);

  // Main Timeline
  useEffect(() => {
    const sequence = [
      { t: 3000, step: 1 }, 
      { t: 4000, step: 2 }, 
      { t: 8000, step: 3 }, 
      { t: 9500, step: 4 }, 
      { t: 11500, step: 5 }, 
      { t: 13500, step: 6 }, 
    ];
    const timeouts = sequence.map(({ t, step: s }) => setTimeout(() => {
      if (!isBreaching) setStep(s);
    }, t));
    return () => timeouts.forEach(clearTimeout);
  }, [isBreaching]);

  const handleInitialize = () => {
    if (isBreaching) return;
    setIsBreaching(true);
    onBreachStart();
    
    AudioSystem.init();
    AudioSystem.playBootSequence();
    AudioSystem.startMusic();
    
    setStep(6);
    setTimeout(onComplete, 800); 
  };

  return {
    step,
    isBreaching,
    showGpuPanel,
    handleInitialize,
    logsToShow: LOG_DATA.slice(0, step + 1),
    
    // Derived State Flags
    showMatrix: step >= 1,
    showPayloadWindow: step >= 2,
    showWarningBox: step >= 3,
    showButton: step >= 6
  };
};
