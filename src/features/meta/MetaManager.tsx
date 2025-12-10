import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

const IDLE_TITLE_TEXT = "MESOELFY // LATENT SPACE BANDIT // ";
const ALERT_DURATION = 2000;
const FULL_HEALTH_TIMEOUT = 3000;

// Mapping full boot logs to short Title/Tab codes (Centered Style)
const BOOT_TITLE_MAP: Record<string, string> = {
    "INITIALIZE NEURAL_LACE": "INIT",
    "CONNECTED TO LATENT_SPACE": "LINK",
    "MOUNT MESOELFY_CORE": "MOUNT",
    "UNSAFE CONNECTION DETECTED": "UNSAFE",
    "BYPASSING SENTINEL_NODES": "BYPASS",
    "DECRYPTED": "OPEN",
    "PROCEED WITH CAUTION": "CAUTION",
};

export const MetaManager = () => {
  const { bootState, setSimulationPaused, isSimulationPaused } = useStore();
  const isZenMode = useGameStore(state => state.isZenMode);
  
  // --- REFS ---
  const lastHashUpdate = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const titleTickerRef = useRef(0); 
  const fullHealthTimer = useRef<NodeJS.Timeout | null>(null);
  
  // --- STATE ---
  const [titleMode, setTitleMode] = useState<'SCROLL' | 'STATUS' | 'ALERT' | 'PAUSED' | 'BOOT'>('BOOT');
  const [alertMsg, setAlertMsg] = useState('');
  const [bootKey, setBootKey] = useState('INIT'); // Current Boot Step Key for Favicon

  // ----------------------------------------------------------------------
  // 1. CONSOLE IDENTITY
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    const cleanAscii = ASCII_CONSOLE.replace(/^\n/, '');
    console.log(`%c${cleanAscii}\n// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.`, CONSOLE_STYLE);
    (window as any).hasLoggedIdentity = true;
  }, []);

  // ----------------------------------------------------------------------
  // 2. AUTO-PAUSE LISTENERS
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (bootState !== 'active') return;

    // Trigger pause on blur/leave, resume on focus/enter
    const handleBlur = () => setSimulationPaused(true);
    const handleFocus = () => setSimulationPaused(false);
    const handleMouseLeave = () => setSimulationPaused(true);
    const handleMouseEnter = () => setSimulationPaused(false);
    const handleVisibility = () => setSimulationPaused(document.hidden);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('mouseenter', handleMouseEnter);
        document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [bootState, setSimulationPaused]);

  // ----------------------------------------------------------------------
  // 3. TITLE & URL EVENT LOGIC
  // ----------------------------------------------------------------------
  useEffect(() => {
      // Alert Helper
      const triggerAlert = (msg: string) => {
          if (isSimulationPaused) return;
          setAlertMsg(msg);
          setTitleMode('ALERT');
          setTimeout(() => {
              if (!useStore.getState().isSimulationPaused) {
                  setTitleMode('STATUS');
              }
          }, ALERT_DURATION);
      };

      const unsubHit = GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => triggerAlert("SYSTEM FAILURE"));
      const unsubDestroy = GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => triggerAlert("PANEL LOST"));
      
      const unsubBoot = GameEventBus.subscribe(GameEvents.BOOT_LOG, (p) => {
          // 1. Find Short Key
          let key = "LOAD";
          for (const k in BOOT_TITLE_MAP) {
              if (p.message.includes(k)) {
                  key = BOOT_TITLE_MAP[k];
                  break;
              }
          }
          setBootKey(key);
          setTitleMode('BOOT');
          document.title = `[ :: ${key} :: ]`; 

          // 2. Update URL Here (Event Driven)
          const safeMsg = p.message
            .replace(/>/g, '')
            .replace(/\./g, '')
            .trim()
            .replace(/ /g, '_');
          window.history.replaceState(null, '', `#/BOOT/${safeMsg}`);
      });

      return () => { unsubHit(); unsubDestroy(); unsubBoot(); };
  }, [isSimulationPaused]);

  // ----------------------------------------------------------------------
  // 4. TITLE RENDER LOOP
  // ----------------------------------------------------------------------
  useEffect(() => {
      const interval = setInterval(() => {
          const integrity = useGameStore.getState().systemIntegrity;
          
          if (titleMode === 'STATUS' && integrity >= 99) {
              if (!fullHealthTimer.current) {
                  fullHealthTimer.current = setTimeout(() => {
                      setTitleMode('SCROLL');
                  }, FULL_HEALTH_TIMEOUT);
              }
          } else if (titleMode === 'SCROLL' && integrity < 99) {
              if (fullHealthTimer.current) {
                  clearTimeout(fullHealthTimer.current);
                  fullHealthTimer.current = null;
              }
              setTitleMode('STATUS');
          }

          let newTitle = "";

          if (titleMode === 'BOOT') {
              return; // Handled by event directly
          } else if (titleMode === 'PAUSED') {
              newTitle = "[ :: SESSION PAUSED :: ]";
          } else if (titleMode === 'ALERT') {
              newTitle = `[ !! ${alertMsg} !! ]`;
          } else if (titleMode === 'STATUS') {
              const blocks = Math.ceil(integrity / 10);
              const filled = "▮".repeat(blocks);
              const empty = "▯".repeat(10 - blocks);
              newTitle = `[ :: ${filled}${empty} INT: ${Math.floor(integrity)}% :: ]`;
          } else if (titleMode === 'SCROLL') {
              const len = IDLE_TITLE_TEXT.length;
              const start = titleTickerRef.current % len;
              const double = IDLE_TITLE_TEXT + IDLE_TITLE_TEXT;
              newTitle = double.substring(start, start + 25).trim(); 
              titleTickerRef.current++;
          }

          if (document.title !== newTitle) {
              document.title = newTitle;
          }

      }, 200);

      return () => clearInterval(interval);
  }, [titleMode, alertMsg, bootState]);


  // ----------------------------------------------------------------------
  // 5. URL HUD LOOP (Gameplay Only)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const updateHash = () => {
      const now = Date.now();
      if (now - lastHashUpdate.current < 500) return;
      lastHashUpdate.current = now;

      let hash = '';
      const state = useStore.getState();
      const gameState = useGameStore.getState();
      const integrity = gameState.systemIntegrity;

      // SKIP IF BOOTING (Let Event Handle It)
      if (state.bootState === 'standby') return;

      if (state.isSimulationPaused) {
          hash = '#/SYSTEM_LOCKED/AWAITING_INPUT';
      } else if (state.bootState === 'sandbox') {
          hash = '#/SIMULATION/HOLO_DECK';
      } else if (gameState.isZenMode) {
          hash = '#/ZEN_GARDEN/PEACE_PROTOCOL';
      } else if (integrity <= 0) {
          hash = '#/STATUS:CRITICAL/SYSTEM_FAILURE';
      } else if (integrity < 30) {
          hash = `#/STATUS:CRITICAL/SYS_INT:${Math.floor(integrity)}%`;
      } else {
          const int = Math.floor(integrity);
          let status = 'STABLE';
          if (integrity < 60) status = 'CAUTION';
          hash = `#/STATUS:${status}/SYS_INT:${int}%`;
      }

      if (window.location.hash !== hash) {
          window.history.replaceState(null, '', hash);
      }
    };

    const interval = setInterval(updateHash, 500);
    return () => clearInterval(interval);
  }, [bootState, isZenMode, isSimulationPaused]);


  // ----------------------------------------------------------------------
  // 6. DYNAMIC FAVICON (CANVAS)
  // ----------------------------------------------------------------------
  useEffect(() => {
      if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
          canvasRef.current.width = 32;
          canvasRef.current.height = 32;
      }

      const updateFavicon = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) return;

          const state = useStore.getState();
          const integrity = useGameStore.getState().systemIntegrity;
          const isPaused = state.isSimulationPaused;
          const isBoot = state.bootState === 'standby';

          const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
              if (w < 2 * r) r = w / 2;
              if (h < 2 * r) r = h / 2;
              ctx.beginPath();
              ctx.moveTo(x + r, y);
              ctx.arcTo(x + w, y, x + w, y + h, r);
              ctx.arcTo(x + w, y + h, x, y + h, r);
              ctx.arcTo(x, y + h, x, y, r);
              ctx.arcTo(x, y, x + w, y, r);
              ctx.closePath();
          };

          // 1. DEFAULT (100% HEALTH & ACTIVE)
          if (!isBoot && !isPaused && integrity >= 99) {
              setFavicon('/favicon.ico');
              return;
          }

          ctx.clearRect(0, 0, 32, 32);

          // --- BOOT ANIMATIONS ---
          if (isBoot) {
              const tick = Math.floor(Date.now() / 200);
              ctx.fillStyle = '#78F654'; // Green
              
              if (bootKey === 'INIT') {
                  // 4-Point Radar (12, 3, 6, 9)
                  const step = tick % 4;
                  const cx = 16, cy = 16;
                  ctx.beginPath();
                  ctx.arc(cx, cy, 2, 0, Math.PI*2); // Center dot
                  
                  if(step === 0) ctx.rect(14, 0, 4, 8); // Top
                  if(step === 1) ctx.rect(24, 14, 8, 4); // Right
                  if(step === 2) ctx.rect(14, 24, 4, 8); // Bottom
                  if(step === 3) ctx.rect(0, 14, 8, 4); // Left
                  ctx.fill();
              }
              else if (bootKey === 'LINK') {
                  // 3 Dots Blinking
                  const step = tick % 3;
                  if(step >= 0) ctx.fillRect(4, 14, 6, 6);
                  if(step >= 1) ctx.fillRect(13, 14, 6, 6);
                  if(step >= 2) ctx.fillRect(22, 14, 6, 6);
              }
              else if (bootKey === 'MOUNT') {
                  // Arrow Down
                  const offset = (tick % 4) * 2;
                  ctx.beginPath();
                  ctx.moveTo(16, 22 + offset);
                  ctx.lineTo(8, 12 + offset);
                  ctx.lineTo(24, 12 + offset);
                  ctx.fill();
                  ctx.fillRect(14, 0, 4, 12 + offset);
              }
              else if (bootKey === 'UNSAFE') {
                  // Red Flashing Block
                  if (tick % 2 === 0) {
                      ctx.fillStyle = '#FF003C';
                      roundRect(4, 4, 24, 24, 4);
                      ctx.fill();
                      ctx.fillStyle = '#000';
                      ctx.font = 'bold 20px monospace';
                      ctx.fillText('!', 12, 24);
                  }
              }
              else if (bootKey === 'BYPASS') {
                  // Matrix Glitch Lines
                  ctx.fillStyle = '#9E4EA5'; // Purple
                  for(let i=0; i<5; i++) {
                      if (Math.random() > 0.5) {
                          ctx.fillRect(0, i*6, Math.random()*32, 4);
                      }
                  }
              }
              else if (bootKey === 'OPEN') {
                  // Green Open Lock
                  ctx.strokeStyle = '#78F654';
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.arc(16, 12, 6, Math.PI, 0); // Shackle
                  ctx.stroke();
                  ctx.fillRect(8, 14, 16, 12); // Body
              }
              else {
                  // CAUTION / DEFAULT (Updated to Square !)
                  ctx.fillStyle = '#F7D277'; // Yellow
                  roundRect(4, 4, 24, 24, 4); // Rounded Square
                  ctx.fill();
                  
                  ctx.fillStyle = '#000000'; // Black Text
                  ctx.font = 'bold 20px monospace';
                  ctx.fillText('!', 12, 24);
              }
          } 
          
          // --- PAUSE ---
          else if (isPaused) {
              const blink = Math.floor(Date.now() / 500) % 2 === 0;
              
              ctx.fillStyle = '#000000';
              roundRect(0, 0, 32, 32, 8); 
              ctx.fill();

              if (blink) {
                  ctx.fillStyle = '#F7D277'; // Yellow
                  // Sharp Rects for Pause Bars
                  ctx.fillRect(10, 8, 4, 16); 
                  ctx.fillRect(18, 8, 4, 16);
              }
          }
          
          // --- GAMEPLAY (DAMAGED) ---
          else {
              let color = '#78F654'; // DEFAULT GREEN (Fixed)
              
              if (integrity < 60) color = '#F7D277'; // Yellow
              if (integrity < 30) color = '#FF003C'; // Red
              
              if (integrity < 30 && Math.floor(Date.now() / 250) % 2 === 0) {
                  color = '#000000';
              }

              ctx.fillStyle = '#111111';
              roundRect(2, 2, 28, 28, 6);
              ctx.fill();

              const fillH = (integrity / 100) * 28;
              const fillY = 30 - fillH;
              
              ctx.save();
              roundRect(2, 2, 28, 28, 6);
              ctx.clip();
              
              ctx.fillStyle = color;
              ctx.fillRect(0, fillY, 32, fillH);
              ctx.restore();
              
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              roundRect(2, 2, 28, 28, 6);
              ctx.stroke();
          }

          setFavicon(canvas.toDataURL("image/x-icon"));
      };

      const setFavicon = (url: string) => {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
          }
          if (link.href !== url) {
              link.href = url;
          }
      };

      const interval = setInterval(updateFavicon, 200); // 5fps
      return () => clearInterval(interval);
  }, [bootKey]); 

  return null;
};

declare global {
  interface Window {
    hasLoggedIdentity?: boolean;
  }
}
