import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

const CANVAS_SIZE = 64;
const IDLE_TIMEOUT_MS = 3000;

// Colors
const COL_GREEN = '#78F654';
const COL_YELLOW = '#F7D277';
const COL_RED = '#FF003C';
const COL_PURPLE = '#9E4EA5';
const COL_BLACK = '#000000';

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
          const tick = Math.floor(now / 50); 
          
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
          let themeHex = COL_BLACK;
          if (!isBoot && !isPaused && !isGameOver) {
              if (integrity < 30) themeHex = COL_RED;      
              else if (integrity < 60) themeHex = COL_YELLOW; 
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
          
          const drawFrame = (borderColor: string, contentCallback: () => void) => {
              ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
              
              ctx.beginPath();
              ctx.roundRect(4, 4, 56, 56, 12);
              ctx.fillStyle = COL_BLACK; 
              ctx.fill();

              contentCallback();

              ctx.lineWidth = 4;
              ctx.strokeStyle = borderColor;
              ctx.beginPath();
              ctx.roundRect(4, 4, 56, 56, 12);
              ctx.stroke();
          };

          // --- FAVICON STATE MACHINE ---

          const isStaticState = (!isBoot && !isPaused && !isGameOver && isIdle100 && integrity >= 99.9);

          if (isStaticState) {
              updateFavicon('/favicon.ico', 'image/x-icon');
              return;
          }

          // 2. BOOT SEQUENCE
          if (isBoot) {
              if (bootKey === 'INIT') {
                  drawFrame(COL_GREEN, () => {
                      const cx = 32, cy = 32;
                      const phase = (tick % 24) / 24; 
                      
                      // Central Node
                      ctx.fillStyle = COL_GREEN;
                      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
                      
                      // Orbiting Nodes
                      for(let i=0; i<3; i++) {
                          const angle = (phase * Math.PI * 2) + (i * (Math.PI * 2 / 3));
                          const ox = cx + Math.cos(angle) * 14;
                          const oy = cy + Math.sin(angle) * 14;
                          
                          ctx.beginPath(); ctx.arc(ox, oy, 2, 0, Math.PI*2); ctx.fill();
                          ctx.strokeStyle = COL_GREEN;
                          ctx.lineWidth = 1;
                          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ox, oy); ctx.stroke();
                      }
                  });
              }
              else if (bootKey === 'LINK') {
                  drawFrame(COL_GREEN, () => {
                      ctx.strokeStyle = COL_GREEN; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                      const t = tick % 20;
                      ctx.beginPath();
                      const p1 = {x: 18, y: 34};
                      const p2 = {x: 28, y: 44};
                      const p3 = {x: 46, y: 22};
                      
                      ctx.moveTo(p1.x, p1.y);
                      if (t < 5) {
                          const progress = t / 5;
                          ctx.lineTo(p1.x + (p2.x-p1.x)*progress, p1.y + (p2.y-p1.y)*progress);
                      } else {
                          ctx.lineTo(p2.x, p2.y);
                          const progress = Math.min(1, (t - 5) / 7);
                          ctx.lineTo(p2.x + (p3.x-p2.x)*progress, p2.y + (p3.y-p2.y)*progress);
                      }
                      ctx.stroke();
                  });
              } 
              else if (bootKey === 'MOUNT') {
                  drawFrame(COL_GREEN, () => {
                      ctx.fillStyle = COL_GREEN;
                      const offset = (tick % 12) * 2;
                      ctx.beginPath(); ctx.moveTo(32, 46 + offset); ctx.lineTo(20, 30 + offset); ctx.lineTo(44, 30 + offset); ctx.fill(); 
                      ctx.fillRect(28, 8, 8, 22 + offset);
                  });
              } 
              else if (bootKey === 'UNSAFE' || bootKey === 'CAUTION') {
                  const activeColor = slowBlink ? COL_YELLOW : COL_RED; 
                  drawFrame(activeColor, () => {
                      ctx.fillStyle = activeColor;
                      ctx.beginPath(); ctx.moveTo(32, 10); ctx.lineTo(52, 50); ctx.lineTo(12, 50); ctx.fill();
                      ctx.fillStyle = COL_BLACK; 
                      ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', 32, 46);
                  });
              } 
              // --- NEW: BYPASS (Phantom Node) ---
              else if (bootKey === 'BYPASS') { 
                  drawFrame(COL_PURPLE, () => {
                      const phase = (tick % 16) / 16; // Faster spin
                      const cx = 32, cy = 32;
                      
                      // Split Effect: 4 "Ghost" diamonds moving out and in
                      const expansion = 4 + (Math.sin(phase * Math.PI * 2) * 6);
                      
                      ctx.fillStyle = COL_PURPLE;
                      for(let i=0; i<4; i++) {
                          const angle = (i * Math.PI / 2) + (phase * Math.PI); // Rotate while expanding
                          const x = cx + Math.cos(angle) * expansion;
                          const y = cy + Math.sin(angle) * expansion;
                          
                          // Draw Diamond
                          ctx.beginPath();
                          ctx.moveTo(x, y - 4);
                          ctx.lineTo(x + 4, y);
                          ctx.lineTo(x, y + 4);
                          ctx.lineTo(x - 4, y);
                          ctx.fill();
                      }
                      
                      // Central Static Core
                      ctx.fillRect(cx - 2, cy - 2, 4, 4);
                  });
              } 
              // --- NEW: DECRYPTED (Unlock Animation) ---
              else if (bootKey === 'DECRYPTED') { 
                  drawFrame(COL_GREEN, () => {
                      // Cycle: 30 ticks (1.5s)
                      // 0-10: Locked
                      // 10-15: Unlocking (Anim)
                      // 15-30: Unlocked
                      const t = tick % 30;
                      const isLocked = t < 10;
                      
                      ctx.strokeStyle = COL_GREEN; 
                      ctx.lineWidth = 6; 
                      ctx.fillStyle = COL_GREEN;

                      // Shackle Logic
                      let shackleY = 28;
                      let shackleOpen = 0;
                      
                      if (!isLocked) {
                          // Pop up animation
                          const anim = Math.min(1, (t - 10) / 5);
                          shackleY = 28 - (anim * 8); // Move Up
                          shackleOpen = anim * 0.5;   // Rotate Open
                      }

                      ctx.beginPath(); 
                      ctx.arc(32, shackleY, 10, Math.PI, 0 + shackleOpen); 
                      ctx.stroke(); 
                      
                      // Body
                      ctx.fillRect(16, 28, 32, 24); 
                      
                      // Keyhole (Only if locked)
                      if (isLocked) {
                          ctx.fillStyle = COL_BLACK;
                          ctx.beginPath(); ctx.arc(32, 40, 3, 0, Math.PI*2); ctx.fill();
                          ctx.fillRect(31, 40, 2, 6);
                      }
                  });
              } 
              else {
                  drawFrame(COL_GREEN, () => {
                      ctx.fillStyle = COL_GREEN; ctx.fillRect(20, 20, 24, 24);
                  });
              }
          }
          
          // 3. PAUSED
          else if (isPaused) {
              if (slowBlink) {
                  drawFrame(COL_YELLOW, () => {
                      ctx.fillStyle = COL_YELLOW;
                      ctx.fillRect(22, 18, 6, 28);
                      ctx.fillRect(36, 18, 6, 28);
                  });
              } else {
                  drawFrame(COL_BLACK, () => {});
              }
          }
          
          // 4. GAME OVER
          else if (isGameOver) {
              if (slowBlink) {
                  drawFrame(COL_RED, () => {
                      ctx.fillStyle = COL_RED;
                      ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
                      ctx.fillText('X', 32, 46);
                  });
              } else {
                  drawFrame(COL_BLACK, () => {});
              }
          }

          // 5. GAMEPLAY (Health)
          else {
              let color = COL_GREEN;
              let isRed = false;

              if (integrity < 60) color = COL_YELLOW;
              if (integrity < 30) { color = COL_RED; isRed = true; }
              
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
                  drawFrame(COL_BLACK, () => {});
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
