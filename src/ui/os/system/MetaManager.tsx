import { useEffect, useState } from 'react';
import { ASCII_CONSOLE, CONSOLE_STYLES } from '@/engine/config/TextAssets';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { BOOT_KEYS } from './metaConstants';
import { useFavicon } from './useFavicon';
import { useMetaUrl } from './hooks/useMetaUrl';
import { useMetaTitle } from './hooks/useMetaTitle';
import { useMetaTheme } from './hooks/useMetaTheme';
import { useWindowFocus } from '@/ui/sim/hooks/useWindowFocus';
import { initializeConsoleScrubber } from './ConsoleScrubber';

export const MetaManager = () => {
  const [bootKey, setBootKey] = useState('INIT');
  const [lastLog, setLastLog] = useState<string | null>(null);

  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    
    initializeConsoleScrubber();

    const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'DEV_NODE';

    console.log(
      `%c${ASCII_CONSOLE}%c\n` +
      ` %c STATUS %c ONLINE %c  ` +
      ` %c KERNEL %c R3F_V9 %c ` +
      ` %c NODE %c ${commitHash} %c\n\n` +
      `%c// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.\n` +
      `%c// LATENT_SPACE_BANDIT // IDENTITY_VERIFIED\n`,
      CONSOLE_STYLES.GREEN,  // ASCII
      '', 
      CONSOLE_STYLES.PURPLE, CONSOLE_STYLES.STATUS, '', // Status Pill
      CONSOLE_STYLES.PURPLE, CONSOLE_STYLES.TAG,    '', // Kernel Pill
      CONSOLE_STYLES.PURPLE, CONSOLE_STYLES.TAG,    '', // Node Pill
      CONSOLE_STYLES.GREEN,  // Message 1
      CONSOLE_STYLES.CYAN    // Message 2
    );

    (window as any).hasLoggedIdentity = true;
  }, []);

  useEffect(() => {
      return GameEventBus.subscribe(GameEvents.BOOT_LOG, (p) => {
          setLastLog(p.message);
          let currentKey = 'INIT';
          for (const k in BOOT_KEYS) { if (p.message.includes(k)) { currentKey = BOOT_KEYS[k]; break; } }
          setBootKey(currentKey);
      });
  }, []);

  useWindowFocus();
  useFavicon(bootKey);
  useMetaUrl(lastLog);
  useMetaTitle(bootKey);
  useMetaTheme();

  return null;
};

declare global { interface Window { hasLoggedIdentity?: boolean; } }
