import { COLORS } from './metaConstants';

const toURI = (svgBody: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${svgBody}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const BG = `<rect x="0" y="0" width="64" height="64" rx="16" fill="#050505" />`;

// --- HEALTH BAR (Matches Pause Style) ---
export const generateHealthIcon = (integrity: number, colorHex: string) => {
  const safeInt = Math.max(0, Math.min(100, integrity));
  
  // Frame logic: 4px stroke, rounded corners
  // Fill logic: Fits exactly inside the frame with 4px padding
  const maxFillHeight = 40; 
  const h = Math.max(0, Math.floor((safeInt / 100) * maxFillHeight));
  const y = 52 - h; // Anchor bottom
  
  return toURI(`
    ${BG}
    <!-- Strong Outer Frame -->
    <rect x="4" y="4" width="56" height="56" rx="12" stroke="${colorHex}" stroke-width="4" fill="none" />
    
    <!-- Solid Inner Fill -->
    <rect x="12" y="${y}" width="40" height="${h}" rx="2" fill="${colorHex}" />
  `);
};

// --- INITIALIZE / BREACH (New Creative Animation) ---
export const generateBreachIcon = (state: 'A' | 'B') => {
  // A "Power Core" that spins and strobes
  const color = state === 'A' ? COLORS.GREEN : '#FFFFFF';
  const rotation = state === 'A' ? 0 : 45;
  const coreSize = state === 'A' ? 16 : 24;
  
  return toURI(`
    ${BG}
    <g transform="rotate(${rotation} 32 32)">
        <!-- Outer Brackets -->
        <path d="M16 10 H10 V16" stroke="${color}" stroke-width="4" fill="none" />
        <path d="M48 10 H54 V16" stroke="${color}" stroke-width="4" fill="none" />
        <path d="M16 54 H10 V48" stroke="${color}" stroke-width="4" fill="none" />
        <path d="M48 54 H54 V48" stroke="${color}" stroke-width="4" fill="none" />
        
        <!-- Spinning Ring -->
        <circle cx="32" cy="32" r="20" stroke="${color}" stroke-width="2" stroke-dasharray="10 10" />
        
        <!-- Pulsing Core -->
        <circle cx="32" cy="32" r="${coreSize}" fill="${color}" />
    </g>
  `);
};

// --- BOOT SEQUENCES (Reverted to Geometric Designs) ---
export const generateBootIcon = (stage: string, tick: boolean) => {
  let inner = '';
  let color = COLORS.GREEN;

  switch (stage) {
    case 'INIT':
      // Center circle + 3 satellites
      const offset = tick ? 14 : -14; 
      inner = `
        <circle cx="32" cy="32" r="4" fill="${color}" />
        <circle cx="${32 + offset}" cy="32" r="3" fill="${color}" />
        <circle cx="${32 - offset/2}" cy="${32 + offset}" r="3" fill="${color}" />
        <circle cx="${32 - offset/2}" cy="${32 - offset}" r="3" fill="${color}" />
        <circle cx="32" cy="32" r="18" stroke="${color}" stroke-width="1" fill="none" opacity="0.5" />
      `;
      break;

    case 'LINK':
      // Zigzag network line
      inner = `
        <polyline points="18,34 28,44 46,22" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="18" cy="34" r="3" fill="${color}" />
        <circle cx="46" cy="22" r="3" fill="${color}" />
      `;
      break;

    case 'MOUNT':
      // Chip insertion
      const yOff = tick ? 8 : 0;
      inner = `
        <path d="M32 ${46 + yOff} L20 ${30 + yOff} L44 ${30 + yOff} Z" fill="${color}" />
        <rect x="28" y="${8 + yOff}" width="8" height="22" fill="${color}" />
      `;
      break;

    case 'UNSAFE':
    case 'CAUTION':
      color = tick ? COLORS.YELLOW : COLORS.RED;
      // Hazard Triangle
      inner = `
        <polygon points="32,10 54,50 10,50" fill="${color}" />
        <rect x="30" y="25" width="4" height="12" fill="#000" />
        <circle cx="32" cy="42" r="2.5" fill="#000" />
      `;
      break;

    case 'BYPASS':
      color = COLORS.PURPLE;
      // Expanding squares
      const s = tick ? 28 : 14; 
      const xy = 32 - (s/2);
      inner = `
        <rect x="${xy}" y="${xy}" width="${s}" height="${s}" stroke="${color}" stroke-width="4" fill="none" />
        <rect x="30" y="30" width="4" height="4" fill="${color}" />
      `;
      break;

    case 'DECRYPTED':
      // Open Shackle Lock
      const sy = tick ? 18 : 28; 
      inner = `
        <path d="M22 ${sy} A10 10 0 0 1 42 ${sy}" stroke="${color}" stroke-width="6" fill="none" />
        <rect x="16" y="28" width="32" height="24" fill="${color}" rx="4" />
        <circle cx="32" cy="40" r="4" fill="#000" />
        <rect x="30" y="40" width="4" height="8" fill="#000" />
      `;
      break;

    default: 
      // Spinner
      inner = `<rect x="28" y="28" width="8" height="8" fill="${color}" />`;
  }

  return toURI(`
    ${BG}
    <rect x="4" y="4" width="56" height="56" rx="12" stroke="${color}" stroke-width="4" fill="none" opacity="0.3" />
    ${inner}
  `);
};

// --- PAUSED (Reverted to Original Style) ---
export const generatePausedIcon = (tick: boolean) => {
  const color = COLORS.YELLOW;
  
  if (!tick) {
      // Blink Off: Show Outline only
      return toURI(`
        ${BG}
        <rect x="4" y="4" width="56" height="56" rx="12" stroke="${color}" stroke-width="2" fill="none" opacity="0.5" />
      `);
  }
  
  // Blink On: Solid Bars
  return toURI(`
    ${BG}
    <rect x="4" y="4" width="56" height="56" rx="12" stroke="${color}" stroke-width="4" fill="none" />
    <rect x="20" y="18" width="8" height="28" fill="${color}" />
    <rect x="36" y="18" width="8" height="28" fill="${color}" />
  `);
};
