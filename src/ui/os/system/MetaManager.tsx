import { useEffect, useState } from 'react';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/engine/config/TextAssets';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { BOOT_KEYS } from './metaConstants';

// Hooks
import { useFavicon } from './useFavicon';
import { useMetaUrl } from './hooks/useMetaUrl';
import { useMetaTitle } from './hooks/useMetaTitle';
import { useMetaTheme } from './hooks/useMetaTheme';
import { useWindowFocus } from '@/ui/sim/hooks/useWindowFocus';

export const MetaManager = () => {
  const [bootKey, setBootKey] = useState('INIT');
  const [lastLog, setLastLog] = useState<string | null>(null);

  // 1. One-time Console Signature
  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    const cleanAscii = ASCII_CONSOLE.replace(/^\n/, '');
    console.log(`%c${cleanAscii}\n// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.`, CONSOLE_STYLE);
    (window as any).hasLoggedIdentity = true;
  }, []);

  // 2. Event Bus Subscription (Data Source)
  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.BOOT_LOG, (p) => {
          setLastLog(p.message);
          
          // Parse Key from Message
          let currentKey = 'INIT';
          for (const k in BOOT_KEYS) {
              if (p.message.includes(k)) {
                  currentKey = BOOT_KEYS[k];
                  break;
              }
          }
          setBootKey(currentKey);
      });
      return unsub;
  }, []);

  // 3. Logic Composition (Behavior)
  useWindowFocus(); // Controls Game Pause State
  
  // 4. Visual Composition (Output)
  useFavicon(bootKey);
  useMetaUrl(lastLog);
  useMetaTitle(bootKey);
  useMetaTheme();

  return null;
};

declare global {
  interface Window {
    hasLoggedIdentity?: boolean;
  }
}
