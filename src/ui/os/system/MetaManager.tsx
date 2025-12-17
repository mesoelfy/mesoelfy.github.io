import { useEffect, useState } from 'react';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/engine/config/TextAssets';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { BOOT_KEYS } from './metaConstants';
import { useFavicon } from './useFavicon';
import { useMetaUrl } from './hooks/useMetaUrl';
import { useMetaTitle } from './hooks/useMetaTitle';
import { useMetaTheme } from './hooks/useMetaTheme';
import { useWindowFocus } from '@/ui/sim/hooks/useWindowFocus';

export const MetaManager = () => {
  const [bootKey, setBootKey] = useState('INIT');
  const [lastLog, setLastLog] = useState<string | null>(null);

  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    console.log(`%c${ASCII_CONSOLE.replace(/^\n/, '')}\n// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.`, CONSOLE_STYLE);
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
