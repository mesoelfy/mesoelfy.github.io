import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

const CANVAS_SIZE = 64;
const IDLE_TIMEOUT_MS = 3000;

// Visual Key Mapping
const BOOT_KEYS: Record<string, string> = {
    "INITIALIZE NEURAL_LACE": "INIT",
    "CONNECTED TO LATENT_SPACE": "LINK",
    "MOUNT MESOELFY_CORE": "MOUNT",
    "UNSAFE CONNECTION DETECTED": "UNSAFE",
    "BYPASSING SENTINEL_NODES": "BYPASS",
    "DECRYPTED": "DECRYPTED",
    "PROCEED WITH CAUTION": "CAUTION",
};

export const MetaManager = () => {
  const { bootState, isSimulationPaused, setSimulationPaused } = useStore();
  
  // STATE SUBSCRIPTIONS
  const integrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHashUpdate = useRef(0);
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const metaThemeRef = useRef<HTMLMetaElement | null>(null);
  
  const [bootKey, setBootKey] = useState('INIT');
  const [isIdle100, setIsIdle100] = useState(false); 

  // 1. CONSOLE IDENTITY
  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    const cleanAscii = ASCII_CONSOLE.replace(/^\n/, '');
    console.log(`%c${cleanAscii}\n// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.`, CONSOLE_STYLE);
    (window as any).hasLoggedIdentity = true;
  }, []);

  // 2. AUTO-PAUSE
  useEffect(() => {
    if (bootState !== 'active') return;

    const handlePause = () => setSimulationPaused(true);
    const handleResume = () => setSimulationPaused(false);
    
    window.addEventListener('blur', handlePause);
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', () => document.hidden ? handlePause() : handleResume());
    document.documentElement.addEventListener('mouseleave', handlePause);
    document.documentElement.addEventListener('mouseenter', handleResume);

    return () => {
        window.removeEventListener('blur', handlePause);
        window.removeEventListener('focus', handleResume);
        document.documentElement.removeEventListener('mouseleave', handlePause);
        document.documentElement.removeEventListener('mouseenter', handleResume);
    };
  }, [bootState, setSimulationPaused]);

  // 3. BOOT EVENTS
  useEffect(() => {
      const unsub = GameEventBus.subscribe(GameEvents.BOOT_LOG, (p) => {
          for (const k in BOOT_KEYS) {
              if (p.message.includes(k)) {
                  setBootKey(BOOT_KEYS[k]);
                  break;
              }
          }
          const safeMsg = p.message.replace(/>/g, '').replace(/\./g, '').trim().replace(/ /g, '_');
          window.history.replaceState(null, '', `#/BOOT/${safeMsg}`);
      });
      return unsub;
  }, []);

  // 4. IDLE TIMER
  useEffect(() => {
      if (bootState !== 'active' || isSimulationPaused || integrity < 99.9) {
          setIsIdle100(false);
          if (idleTimerRef.current) {
              clearTimeout(idleTimerRef.current);
              idleTimerRef.current = null;
          }
          return;
      }

      if (!isIdle100 && !idleTimerRef.current) {
          idleTimerRef.current = setTimeout(() => {
              setIsIdle100(true);
          }, IDLE_TIMEOUT_MS);
      }
  }, [bootState, isSimulationPaused, integrity]); 

  // 5. INITIALIZE DOM
  useEffect(() => {
      let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
      if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'theme-color';
          document.head.appendChild(meta);
      }
      metaThemeRef.current = meta;

      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
      }
      linkRef.current = link;

      if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
          canvasRef.current.width = CANVAS_SIZE;
          canvasRef.current.height = CANVAS_SIZE;
      }
  }, []);

  // 6. RENDER LOOP
  useEffect(() => {
      const updateFavicon = (url: string, type: string) => {
          if (!linkRef.current) return;
          if (linkRef.current.href !== url) {
              linkRef.current.type = type;
              linkRef.current.href = url;
          }
      };

      const updateTheme = (hex: string) => {
          if (!metaThemeRef.current) return;
          if (metaThemeRef.current.content !== hex) {
              metaThemeRef.current.content = hex;
          }
      };

      const updateAll = () => {
          const ctx = canvasRef.current?.getContext('2d');
          if (!ctx) return;

          const gameState = useGameStore.getState();
          const integrity = useGameStore.getState().systemIntegrity;
          const isGameOver = integrity <= 0;
          const isPaused = useStore.getState().isSimulationPaused;
          const isBoot = useStore.getState().bootState === 'standby';
          const isSandbox = useStore.getState().bootState === 'sandbox';
          const isZen = gameState.isZenMode;

          const now = Date.now();
          const tick = Math.floor(now / 50); // 20 FPS
          
          const slowBlink = tick % 16 < 8; 
          const fastBlink = tick % 10 < 5; 

          // --- URL HUD ---
          if (!isBoot && now - lastHashUpdate.current > 500) {
              let hash = '';
              if (isPaused) hash = '#/SYSTEM_LOCKED/AWAITING_INPUT';
              else if (isSandbox) hash = '#/SIMULATION/HOLO_DECK';
              else if (isZen) hash = '#/ZEN_GARDEN/PEACE_PROTOCOL';
              else if (isGameOver) hash = '#/STATUS:CRITICAL/SYSTEM_FAILURE';
              else if (integrity < 30) hash = `#/STATUS:CRITICAL/SYS_INT:${Math.floor(integrity)}%`;
              else {
                  const int = Math.floor(integrity);
                  let status = 'STABLE';
                  if (integrity < 60) status = 'CAUTION';
                  hash = `#/STATUS:${status}/SYS_INT:${int}%`;
              }
              if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
              lastHashUpdate.current = now;
          }

          // --- THEME COLOR ---
          let themeHex = '#000000';
          if (!isBoot && !isPaused && !isGameOver) {
              if (integrity < 30) themeHex = '#FF003C';      
              else if (integrity < 60) themeHex = '#F7D277'; 
          }
          updateTheme(themeHex);

          // --- TITLE ---
          let title = "";
          if (isBoot) title = `[ :: // ${bootKey} // :: ]`;
          else if (isGameOver) title = `[ :: SESSION FAILURE :: ]`;
          else if (isPaused) title = `[ :: SYSTEM PAUSED :: ]`;
          else if (isIdle100 && integrity >= 99.9) title = "[ :: // MESOELFY // :: ]";
          else {
              const intVal = Math.floor(integrity);
              let bar = "";
              const activeIndex = Math.floor(integrity / 10);
              for(let i=0; i<10; i++) {
                  if (i < activeIndex) bar += "▮";
                  else if (i === activeIndex && integrity > 0) bar += fastBlink ? "▮" : "▯";
                  else bar += "▯";
              }
              title = `[ ${bar} INT: ${intVal}% ]`;
          }
          if (document.title !== title) document.title = title;

          // --- DRAWING HELPERS ---
          
          // Clears canvas and draws standard container
          const drawFrame = (borderColor: string, contentCallback: () => void) => {
              ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
              
              // 1. Black Void Fill
              ctx.beginPath();
              ctx.roundRect(4, 4, 56, 56, 12);
              ctx.fillStyle = '#000000'; 
              ctx.fill();

              // 2. Content
              contentCallback();

              // 3. Colored Border
              ctx.lineWidth = 4;
              ctx.strokeStyle = borderColor;
              ctx.beginPath();
              ctx.roundRect(4, 4, 56, 56, 12);
              ctx.stroke();
          };

          // --- FAVICON STATE MACHINE ---

          // 1. STATIC IDLE
          // Only if explicitly safe and idle
          if (!isBoot && !isPaused && !isGameOver && isIdle100 && integrity >= 99.9) {
              updateFavicon('/favicon.ico', 'image/x-icon');
              return;
          }

          // 2. BOOT SEQUENCE
          if (isBoot) {
              if (bootKey === 'INIT') {
                  // Fallback to static for initial moment
                  updateFavicon('/favicon.ico', 'image/x-icon'); 
                  return;
              }

              let color = '#78F654'; // Default Green
              if (bootKey === 'UNSAFE' || bootKey === 'CAUTION') color = slowBlink ? '#F7D277' : '#FF003C';
              if (bootKey === 'BYPASS') color = '#9E4EA5'; // Purple

              drawFrame(color, () => {
                  ctx.fillStyle = color;
                  const cx = 32;
                  
                  if (bootKey === 'LINK') {
                      // Checkmark
                      ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                      ctx.beginPath(); ctx.moveTo(18, 34); ctx.lineTo(28, 44); ctx.lineTo(46, 22); ctx.stroke();
                  } 
                  else if (bootKey === 'MOUNT') {
                      // Arrow
                      const offset = (tick % 12) * 2;
                      ctx.beginPath(); ctx.moveTo(32, 46 + offset); ctx.lineTo(20, 30 + offset); ctx.lineTo(44, 30 + offset); ctx.fill(); 
                      ctx.fillRect(28, 8, 8, 22 + offset);
                  } 
                  else if (bootKey === 'UNSAFE' || bootKey === 'CAUTION') {
                      // Exclamation
                      if (slowBlink) {
                          ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', 32, 44);
                      }
                  } 
                  else if (bootKey === 'BYPASS') { 
                      // Locked Padlock (Solid)
                      ctx.strokeStyle = color; ctx.lineWidth = 6; 
                      ctx.beginPath(); ctx.arc(32, 28, 10, Math.PI, 0); ctx.stroke(); 
                      ctx.fillRect(16, 28, 32, 24); 
                      ctx.fillStyle = '#000'; ctx.fillRect(30, 38, 4, 6);
                  } 
                  else if (bootKey === 'DECRYPTED') { 
                      // Unlocked Padlock (Solid Green)
                      const c = '#78F654'; // Force green
                      ctx.fillStyle = c; ctx.strokeStyle = c;
                      ctx.lineWidth = 6; 
                      ctx.beginPath(); ctx.arc(32, 20, 10, Math.PI, 0.5); ctx.stroke(); 
                      ctx.fillRect(16, 28, 32, 24);
                  }
              });
          }
          
          // 3. PAUSED
          else if (isPaused) {
              if (slowBlink) {
                  drawFrame('#F7D277', () => {
                      ctx.fillStyle = '#F7D277';
                      ctx.fillRect(22, 18, 6, 28);
                      ctx.fillRect(36, 18, 6, 28);
                  });
              } else {
                  // Blink Off: Just empty black frame with dark border? 
                  // Or just black box. Let's keep the box shape to avoid jumping.
                  drawFrame('#111111', () => {}); 
              }
          }
          
          // 4. GAME OVER
          else if (isGameOver) {
              if (slowBlink) {
                  drawFrame('#FF003C', () => {
                      ctx.fillStyle = '#FF003C';
                      ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
                      ctx.fillText('X', 32, 46);
                  });
              } else {
                  drawFrame('#111111', () => {});
              }
          }

          // 5. GAMEPLAY (Health)
          else {
              let color = '#78F654';
              let isRed = false;

              if (integrity < 60) color = '#F7D277';
              if (integrity < 30) { color = '#FF003C'; isRed = true; }
              
              let showIcon = true;
              if (isRed && !fastBlink) showIcon = false;

              if (showIcon) {
                  drawFrame(color, () => {
                      const fillH = (integrity / 100) * 56;
                      const fillY = 60 - fillH;
                      ctx.save();
                      ctx.beginPath(); ctx.roundRect(4, 4, 56, 56, 12); ctx.clip();
                      ctx.fillStyle = color; 
                      ctx.fillRect(0, fillY, 64, fillH);
                      ctx.restore();
                  });
              } else {
                  drawFrame('#111111', () => {});
              }
          }

          updateFavicon(canvasRef.current!.toDataURL('image/png'), 'image/png');
      };

      const interval = setInterval(updateAll, 50); 
      return () => clearInterval(interval);
  }, [bootKey, isIdle100, integrity, isZenMode]); 

  return null;
};

declare global {
  interface Window {
    hasLoggedIdentity?: boolean;
  }
}
