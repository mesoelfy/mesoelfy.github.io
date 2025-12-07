import { useEffect, useState, useRef } from 'react';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

const IDLE_MESSAGES = [
  "SYSTEM_MONITORING...",
  "SCANNING_LATENT_SECTORS...",
  "ENCRYPTION_ACTIVE...",
  "PACKET_STREAM_STABLE...",
  "PINGING_NEURAL_NET...",
  "RENDERING_CONTEXT...",
];

export const Footer = () => {
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'UNKNOWN';
  const actionsUrl = "https://github.com/mesoelfy/mesoelfy.github.io/actions";
  
  const [log, setLog] = useState<{ text: string, type: 'info' | 'warn' | 'crit' }>({ 
      text: "SYSTEM_ONLINE", type: 'info' 
  });
  
  // To prevent rapid flickering, we lock the ticker for 2 seconds on important events
  const lockUntilRef = useRef(0);

  useEffect(() => {
    // 1. Event Listeners
    const unsubHit = GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => {
        if (Date.now() < lockUntilRef.current) return;
        setLog({ text: ">> WARNING: HULL BREACH DETECTED", type: 'warn' });
        lockUntilRef.current = Date.now() + 1000;
    });

    const unsubDamage = GameEventBus.subscribe(GameEvents.PANEL_DAMAGED, (p) => {
        if (Date.now() < lockUntilRef.current) return;
        setLog({ text: `>> ALERT: SECTOR [${p.id.toUpperCase()}] SUSTAINING DAMAGE`, type: 'warn' });
        lockUntilRef.current = Date.now() + 1500;
    });

    const unsubDestroy = GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, (p) => {
        setLog({ text: `⚠ CRITICAL: SECTOR [${p.id.toUpperCase()}] OFFLINE ⚠`, type: 'crit' });
        lockUntilRef.current = Date.now() + 3000; // Critical messages stay longer
    });

    const unsubSpawn = GameEventBus.subscribe(GameEvents.ENEMY_SPAWNED, (p) => {
        if (Date.now() < lockUntilRef.current) return;
        // 10% chance to show spawn logs to avoid spam
        if (Math.random() > 0.9) {
            setLog({ text: `>> SENSOR: NEW SIGNAL [${p.type.toUpperCase()}] DETECTED`, type: 'info' });
        }
    });
    
    const unsubHeal = GameEventBus.subscribe(GameEvents.PANEL_HEALED, (p) => {
        if (Date.now() < lockUntilRef.current) return;
        setLog({ text: `>> MAINTENANCE: RESTORING [${p.id.toUpperCase()}]`, type: 'info' });
    });

    // 2. Idle Loop
    const interval = setInterval(() => {
        if (Date.now() > lockUntilRef.current) {
            const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
            setLog({ text: msg, type: 'info' });
        }
    }, 4000);

    return () => {
        unsubHit(); unsubDamage(); unsubDestroy(); unsubSpawn(); unsubHeal();
        clearInterval(interval);
    };
  }, []);

  return (
    <footer className="w-full h-8 border-t border-elfy-green-dim/30 bg-black flex items-center justify-between px-4 z-40 shrink-0 text-[10px] font-mono overflow-hidden">
      
      {/* LEFT: System Log */}
      <div className="flex-1 flex items-center gap-2 overflow-hidden mr-4">
        <span className="text-elfy-green-dim shrink-0">LOG:</span>
        <AnimatePresence mode="wait">
            <motion.span 
                key={log.text} // Key change triggers animation
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                    "whitespace-nowrap font-bold tracking-wider truncate",
                    log.type === 'crit' ? "text-elfy-red animate-pulse" : 
                    log.type === 'warn' ? "text-elfy-yellow" : 
                    "text-elfy-green"
                )}
            >
                {log.text}
            </motion.span>
        </AnimatePresence>
      </div>

      {/* RIGHT: Version */}
      <div className="flex items-center gap-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <span>VER:</span>
        <a 
          href={actionsUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-elfy-green-dim hover:text-elfy-green transition-colors decoration-dashed underline underline-offset-2"
        >
          {commitHash}
        </a>
      </div>
    </footer>
  );
};
