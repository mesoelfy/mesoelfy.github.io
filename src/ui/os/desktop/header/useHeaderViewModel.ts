import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/engine/state/global/useStore';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useGameStream } from '@/ui/hooks/useGameStream';
import { useHeartbeat } from '@/ui/sim/hooks/useHeartbeat';

export const useHeaderViewModel = () => {
  const { audioSettings, toggleMaster, toggleMusic, toggleSfx, toggleAmbience, toggleSettings } = useStore();
  const isPlaying = useGameStore(state => state.isPlaying);
  const isZenMode = useGameStore(state => state.isZenMode);
  
  const scoreRef = useRef<HTMLSpanElement>(null);
  const integrityRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [integrityState, setIntegrityState] = useState(100);

  useGameStream('SCORE', (v) => {
      if (scoreRef.current) scoreRef.current.innerText = Math.floor(v).toString().padStart(4, '0');
  });
  
  useGameStream('SYSTEM_INTEGRITY', (val) => {
      if (barRef.current) barRef.current.style.width = `${val}%`;
      setIntegrityState(val);
      if (!isZenMode && integrityRef.current) {
          integrityRef.current.innerText = `OS_INTEGRITY: ${Math.floor(val)}%`;
      }
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isCritical = integrityState < 30;
  const isWarning = integrityState < 60;
  const isGameOver = integrityState <= 0;
  
  let statusColor = "text-primary-green";
  if (isZenMode) statusColor = "text-purple-300"; 
  else if (isCritical) statusColor = "text-critical-red";
  else if (isWarning) statusColor = "text-alert-yellow";

  const borderColor = isZenMode ? "border-purple-500/30" : "border-white/10";
  const heartbeatControls = useHeartbeat();
  const slowTransition = "transition-colors duration-[2000ms]";

  return {
    mounted,
    audioSettings, toggleMaster, toggleMusic, toggleSfx, toggleAmbience, toggleSettings,
    isPlaying, isZenMode, isCritical, isWarning, isGameOver,
    statusColor, borderColor, heartbeatControls, slowTransition,
    scoreRef, integrityRef, barRef
  };
};
