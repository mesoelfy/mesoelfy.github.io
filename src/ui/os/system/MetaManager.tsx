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

export const MetaManager = () => {
  const [bootKey, setBootKey] = useState('INIT');
  const [lastLog, setLastLog] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).hasLoggedIdentity) return;

    const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'DEV_NODE';

    console.log(
      `%c${ASCII_CONSOLE}%c\n` +
      ` %c STATUS %c ONLINE %c  ` +
      ` %c KERNEL %c R3F_V9 %c ` +
      ` %c NODE %c ${commitHash} %c\n\n` +
      `%c// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.\n` +
      `%c// LATENT_SPACE_BANDIT // IDENTITY_VERIFIED\n`,
      CONSOLE_STYLES.GREEN,
      '', 
      CONSOLE_STYLES.PURPLE, CONSOLE_STYLES.STATUS, '', 
      CONSOLE_STYLES.PURPLE, CONSOLE_STYLES.TAG,    '', 
      CONSOLE_STYLES.PURPLE, CONSOLE_STYLES.TAG,    '', 
      CONSOLE_STYLES.GREEN, 
      CONSOLE_STYLES.CYAN
    );

    // RESTORED: Debug Hint
    console.log(
      `%c[DEV_HINT] To silence YouTube/AdBlock errors, paste this filter above:\n` +
      `%c-source:www-embed-player.js -source:base.js -ERR_BLOCKED_BY_CLIENT`,
      'color: gray; font-style: italic;',
      'color: #eae747; background: #222; padding: 2px 4px; border-radius: 2px;'
    );

    (window as any).hasLoggedIdentity = true;
  }, []);

  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.BOOT_LOG, (p) => {
          setLastLog(p.message);
          
          let foundKey = 'INIT';
          for (const [textMatch, code] of Object.entries(BOOT_KEYS)) {
              if (p.message.includes(textMatch)) { 
                  foundKey = code;
                  break; 
              }
          }
          
          setBootKey(prev => {
              if (prev !== foundKey) return foundKey;
              return prev;
          });
      });
      return unsub;
  }, []);

  useWindowFocus();
  useFavicon(bootKey);
  useMetaUrl(lastLog);
  useMetaTitle(bootKey);
  useMetaTheme();

  return null;
};

declare global { interface Window { hasLoggedIdentity?: boolean; } }
