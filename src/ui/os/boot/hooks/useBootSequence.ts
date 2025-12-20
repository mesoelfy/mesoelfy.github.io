import { useState, useEffect } from 'react';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { LOG_DATA } from '../data/bootLogs';
import { BOOT_SEQUENCE } from '@/engine/config/BootConfig';

interface UseBootSequenceProps {
  onComplete: () => void;
  onBreachStart: () => void;
}

export const useBootSequence = ({ onComplete, onBreachStart }: UseBootSequenceProps) => {
  const [step, setStep] = useState(0); 
  const [isBreaching, setIsBreaching] = useState(false);
  const [showGpuPanel, setShowGpuPanel] = useState(false); 

  useEffect(() => {
    if (LOG_DATA[step]) {
        GameEventBus.emit(GameEvents.BOOT_LOG, { message: LOG_DATA[step].text });
    }
    
    if (step >= 6 && !showGpuPanel) {
        const timer = setTimeout(() => {
            setShowGpuPanel(true);
            AudioSystem.playSound('ui_menu_open');
        }, 1000); 
        return () => clearTimeout(timer);
    }
  }, [step, showGpuPanel]);

  useEffect(() => {
    const { TIMINGS } = BOOT_SEQUENCE;
    const sequence = [
      { t: TIMINGS.INIT, step: 1 }, 
      { t: TIMINGS.LINK, step: 2 }, 
      { t: TIMINGS.SECURITY_CHECK, step: 3 }, 
      { t: TIMINGS.BYPASS, step: 4 }, 
      { t: TIMINGS.DECRYPT, step: 5 }, 
      { t: TIMINGS.READY, step: 6 }, 
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
    setTimeout(onComplete, BOOT_SEQUENCE.COMPLETION_DELAY); 
  };

  return {
    step,
    isBreaching,
    showGpuPanel,
    handleInitialize,
    logsToShow: LOG_DATA.slice(0, step + 1),
    showMatrix: step >= 1,
    showPayloadWindow: step >= 2,
    showWarningBox: step >= 3,
    showButton: step >= 6
  };
};
