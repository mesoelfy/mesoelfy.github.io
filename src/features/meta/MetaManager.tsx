import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { ASCII_CONSOLE, CONSOLE_STYLE } from '@/game/config/TextAssets';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

const CANVAS_SIZE = 64;
const IDLE_TIMEOUT_MS = 3000;

const BOOT_KEYS: Record<string, string> = {
    "INITIALIZE NEURAL_LACE": "INIT",
    "CONNECTED TO LATENT_SPACE": "LINK",
    "MOUNT MESOELFY_CORE": "MOUNT",
    "UNSAFE CONNECTION DETECTED": "UNSAFE",
    "BYPASSING SENTINEL_NODES": "BYPASS",
    "DECRYPTED": "OPEN",
    "PROCEED WITH CAUTION": "CAUTION",
};

export const MetaManager = () => {
  const { bootState, isSimulationPaused, setSimulationPaused } = useStore();
  
  // REACTIVE STATE SUBSCRIPTIONS (Crucial for updates)
  const integrity = useGameStore(s => s.systemIntegrity);
  const isZenMode = useGameStore(s => s.isZenMode);
  
  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHashUpdate = useRef(0);
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const metaThemeRef = useRef<HTMLMetaElement | null>(null);
  
  // --- STATE ---
  const [bootKey, setBootKey] = useState('INIT');
  const [isIdle100, setIsIdle100] = useState(false); 

  // 1. CONSOLE IDENTITY
  useEffect(() => {
    if (window.hasLoggedIdentity) return;
    const cleanAscii = ASCII_CONSOLE.replace(/^\n/, '');
    console.log(`%c${cleanAscii}\n// TERMINAL UPLINK ESTABLISHED. WELCOME TO THE VOID.`, CONSOLE_STYLE);
    (window as any).hasLoggedIdentity = true;
  }, []);

  // 2. AUTO-PAUSE LISTENERS
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

  // 4. IDLE TIMER (Strict Reset)
  useEffect(() => {
      // If we take ANY damage, pause, or reboot, force Dynamic Mode immediately.
      if (bootState !== 'active' || isSimulationPaused || integrity < 99.9) {
          setIsIdle100(false);
          if (idleTimerRef.current) {
              clearTimeout(idleTimerRef.current);
              idleTimerRef.current = null;
          }
          return;
      }

      // If stable at 100%, start countdown to Idle Mode
      if (!isIdle100 && !idleTimerRef.current) {
          idleTimerRef.current = setTimeout(() => {
              setIsIdle100(true);
          }, IDLE_TIMEOUT_MS);
      }
  }, [bootState, isSimulationPaused, integrity]); // integrity is now a proper dependency

  // 5. INITIALIZE DOM
  useEffect(() => {
      // Theme Meta
      let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
      if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'theme-color';
          document.head.appendChild(meta);
      }
      metaThemeRef.current = meta;

      // Favicon Link (Find existing or create)
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
      }
      linkRef.current = link;

      // Canvas
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

          // Local state capture
          const isGameOver = integrity <= 0;
          const isPaused = isSimulationPaused;
          const isBoot = bootState === 'standby';
          const isSandbox = bootState === 'sandbox';
          const isZen = isZenMode;

          const now = Date.now();
          const tick = Math.floor(now / 50); // 20 FPS
          
          // Blink Rates
          const slowBlink = tick % 16 < 8; // 800ms cycle
          const fastBlink = tick % 10 < 5; // 500ms cycle (Standard Alert)

          // --- A. URL HUD ---
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

          // --- B. THEME COLOR ---
          let themeHex = '#000000';
          if (!isBoot && !isPaused && !isGameOver) {
              if (integrity < 30) themeHex = '#FF003C';      
              else if (integrity < 60) themeHex = '#F7D277'; 
          }
          updateTheme(themeHex);

          // --- C. TITLE ---
          let title = "";
          if (isBoot) title = `[ :: // ${bootKey} // :: ]`;
          else if (isGameOver) title = `[ :: SESSION FAILURE :: ]`;
          else if (isPaused) title = `[ :: SYSTEM PAUSED :: ]`;
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

          // --- D. FAVICON ---
          
          // IDLE STATE Check
          const isStaticState = (isBoot && bootKey === 'INIT') || 
                                (!isBoot && !isPaused && !isGameOver && isIdle100);

          if (isStaticState) {
              updateFavicon('/favicon.ico', 'image/x-icon');
              return;
          }

          ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

          const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
              ctx.beginPath();
              ctx.roundRect(x, y, w, h, r);
              ctx.closePath();
          };

          if (isBoot) {
              ctx.fillStyle = '#78F654'; 
              const cx = 32, cy = 32;

              if (bootKey === 'LINK') {
                  ctx.strokeStyle = '#78F654'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                  ctx.beginPath(); ctx.moveTo(14, 34); ctx.lineTo(26, 46); ctx.lineTo(50, 18); ctx.stroke();
              } else if (bootKey === 'MOUNT') {
                  const offset = (tick % 12) * 2;
                  ctx.beginPath(); ctx.moveTo(32, 48 + offset); ctx.lineTo(16, 28 + offset); ctx.lineTo(48, 28 + offset); ctx.fill(); ctx.fillRect(26, 0, 12, 28 + offset);
              } else if (bootKey === 'UNSAFE' || bootKey === 'CAUTION') {
                  const color = bootKey === 'UNSAFE' ? '#FF003C' : '#F7D277';
                  if (slowBlink) {
                      ctx.fillStyle = color;
                      ctx.beginPath(); ctx.moveTo(32, 4); ctx.lineTo(60, 56); ctx.lineTo(4, 56); ctx.fill();
                      ctx.fillStyle = '#000'; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', 32, 52);
                  }
              } else if (bootKey === 'OPEN') {
                  ctx.strokeStyle = '#78F654'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(32, 24, 12, Math.PI, 0); ctx.stroke(); ctx.fillRect(16, 28, 32, 24); 
              } else if (bootKey === 'INIT') {
                  const r = (tick % 12) * 2; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#78F654'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 10 + r, 0, Math.PI*2); ctx.stroke();
              } else {
                  ctx.fillStyle = '#9E4EA5'; for(let i=0; i<8; i++) if (Math.random() > 0.5) ctx.fillRect(0, i*8, Math.random()*64, 6);
              }
          }
          else if (isPaused) {
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
              
              if (slowBlink) {
                  ctx.strokeStyle = '#F7D277';
                  ctx.lineWidth = 6;
                  ctx.strokeRect(4, 4, 56, 56);
                  ctx.fillStyle = '#F7D277';
                  ctx.fillRect(20, 16, 8, 32);
                  ctx.fillRect(36, 16, 8, 32);
              }
          }
          else {
              // GAMEPLAY STATE
              let color = '#78F654';
              let isRed = false;

              if (integrity < 60) color = '#F7D277';
              if (integrity < 30) { color = '#FF003C'; isRed = true; }
              
              let showIcon = true;

              if (isGameOver && !slowBlink) {
                  showIcon = false;
              }
              else if (isRed && !isGameOver) {
                  // STEADY FAST BLINK (500ms) for critical
                  if (!fastBlink) showIcon = false;
              }

              if (showIcon) {
                  ctx.fillStyle = '#111111'; roundRect(4, 4, 56, 56, 12); ctx.fill();
                  const fillH = (integrity / 100) * 56;
                  const fillY = 60 - fillH;
                  ctx.save(); roundRect(4, 4, 56, 56, 12); ctx.clip();
                  ctx.fillStyle = color; ctx.fillRect(0, fillY, 64, fillH); ctx.restore();
                  ctx.strokeStyle = color; ctx.lineWidth = 4; roundRect(4, 4, 56, 56, 12); ctx.stroke();
              } else {
                  // BLINK OFF STATE: BLACK FILL
                  ctx.fillStyle = '#000000';
                  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
                  
                  // Optional: Keep border visible? 
                  // User said "Black fill and edge for off blink". 
                  // If we want Edge to persist:
                  /*
                  ctx.strokeStyle = '#330000'; // Dark red rim?
                  ctx.lineWidth = 4;
                  roundRect(4, 4, 56, 56, 12);
                  ctx.stroke();
                  */
              }
          }

          updateFavicon(canvasRef.current!.toDataURL('image/png'), 'image/png');
      };

      const interval = setInterval(updateAll, 50); 
      return () => clearInterval(interval);
  }, [bootKey, isIdle100, integrity, isZenMode]); // Added integrity to dependencies

  return null;
};

declare global {
  interface Window {
    hasLoggedIdentity?: boolean;
  }
}
