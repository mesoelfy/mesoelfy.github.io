import { useEffect, useState, useRef } from 'react';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { clsx } from 'clsx';

const IDLE_MESSAGES = [
  "SYSTEM_MONITORING...", "SCANNING_LATENT_SECTORS...", "ENCRYPTION_ACTIVE...",
  "PACKET_STREAM_STABLE...", "PINGING_NEURAL_NET...", "RENDERING_CONTEXT...",
];

export const Footer = () => {
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'UNKNOWN';
  const actionsUrl = "https://github.com/mesoelfy/mesoelfy.github.io/actions";
  const systemIntegrity = useGameStore(state => state.systemIntegrity);
  const isZenMode = useGameStore(state => state.isZenMode);
  
  const isGameOver = systemIntegrity <= 0;
  const isCritical = systemIntegrity < 30;
  const isWarning = systemIntegrity < 60;

  let globalColor = "text-primary-green-dim border-primary-green-dim/30";
  if (isZenMode) globalColor = "text-purple-400 border-purple-500/30";
  else if (isGameOver) globalColor = "text-critical-red border-critical-red/50";
  else if (isCritical) globalColor = "text-critical-red border-critical-red/30";
  else if (isWarning) globalColor = "text-alert-yellow border-alert-yellow/30";

  const [log, setLog] = useState<{ text: string, type: 'info' | 'warn' | 'crit' | 'zen' }>({ text: "SYSTEM_ONLINE", type: 'info' });
  const lockUntilRef = useRef(0);

  useEffect(() => {
    const canUpdate = () => {
        const state = useGameStore.getState();
        if (state.systemIntegrity <= 0 && !state.isZenMode) return false;
        return Date.now() > lockUntilRef.current;
    };

    const unsubHit = GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => {
        if (!canUpdate()) return;
        setLog({ text: ">> WARNING: HULL BREACH DETECTED", type: 'warn' });
        lockUntilRef.current = Date.now() + 1000;
    });
    const unsubDamage = GameEventBus.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
        if (!canUpdate()) return;
        setLog({ text: `>> ALERT: SECTOR [${p.id.toUpperCase()}] SUSTAINING DAMAGE`, type: 'warn' });
        lockUntilRef.current = Date.now() + 1500;
    });
    const unsubDestroy = GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        if (useGameStore.getState().isZenMode) return;
        if (useGameStore.getState().systemIntegrity <= 0) return;
        setLog({ text: `⚠ CRITICAL: SECTOR [${p.id.toUpperCase()}] OFFLINE ⚠`, type: 'crit' });
        lockUntilRef.current = Date.now() + 3000;
    });
    const unsubGameOver = GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        setLog({ text: "⚠ SYSTEM FAILURE // CONNECTION LOST ⚠", type: 'crit' });
        lockUntilRef.current = Date.now() + 999999999; 
    });
    const unsubZen = GameEventBus.subscribe(GameEvents.ZEN_MODE_ENABLED, () => {
        setLog({ text: "∞ ZEN MODE ACTIVE // STRESS DISSOLVING...", type: 'zen' });
        lockUntilRef.current = Date.now() + 999999999; 
    });
    
    // ... (Other handlers omitted for brevity, logic remains same)

    const interval = setInterval(() => {
        if (canUpdate() && !useGameStore.getState().isZenMode) {
            setLog({ text: IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)], type: 'info' });
        }
    }, 4000);

    return () => {
        unsubHit(); unsubDamage(); unsubDestroy(); unsubGameOver(); unsubZen();
        clearInterval(interval);
    };
  }, []);

  return (
    <footer className={clsx("w-full h-8 border-t bg-black flex items-center justify-between px-4 z-40 shrink-0 text-[10px] font-mono overflow-hidden transition-colors duration-500", globalColor)}>
      <div className="flex-1 flex items-center gap-2 overflow-hidden mr-4">
        <span className="shrink-0 font-bold">LOG:</span>
        <AnimatePresence mode="wait">
            <motion.span 
                key={log.text} 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -5 }} 
                transition={{ duration: 0.2 }} 
                className={clsx(
                    "whitespace-nowrap font-bold tracking-wider truncate", 
                    isZenMode ? "text-purple-300 animate-pulse" :
                    isGameOver || log.type === 'crit' ? "text-critical-red animate-pulse" : 
                    log.type === 'warn' ? "text-alert-yellow" : 
                    "text-primary-green"
                )}
            >
                {log.text}
            </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <span>VER:</span>
        <a href={actionsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors decoration-dashed underline underline-offset-2">{commitHash}</a>
      </div>
    </footer>
  );
};
