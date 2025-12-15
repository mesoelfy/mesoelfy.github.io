export type VFXPattern = 'RADIAL' | 'DIRECTIONAL';

export interface VFXRecipe {
  pattern: VFXPattern;
  colors: string[];
  count: [number, number];
  speed: [number, number];
  life: [number, number];
  spread?: number;
  size?: [number, number];
  shape?: number; // 0=Square, 1=Teardrop
  omniChance?: number; // 0.0 - 1.0: Chance for a particle to be Backblast
}

const PALETTE_PURPLE = ['#9E4EA5', '#D0A3D8', '#E0B0FF', '#7A2F8F', '#B57EDC'];
const PALETTE_YELLOW = ['#F7D277', '#FFE5A0', '#FFA500', '#FFFFFF'];
const PALETTE_RED = ['#FF003C', '#FF4D6D', '#800010'];
const PALETTE_CYAN = ['#00F0FF', '#008ba3', '#FFFFFF'];

export const VFX_RECIPES: Record<string, VFXRecipe> = {
  // --- EXPLOSIONS (RADIAL) ---
  'EXPLOSION_PURPLE': { pattern: 'RADIAL', colors: PALETTE_PURPLE, count: [15, 25], speed: [5, 10], life: [0.5, 0.8] },
  'EXPLOSION_YELLOW': { pattern: 'RADIAL', colors: PALETTE_YELLOW, count: [12, 18], speed: [8, 15], life: [0.4, 0.7] },
  'EXPLOSION_RED':    { pattern: 'RADIAL', colors: PALETTE_RED, count: [15, 25], speed: [10, 20], life: [0.6, 1.0] },
  
  // --- EXPLOSIONS (DIRECTIONAL HYBRID) ---
  'EXPLOSION_PURPLE_DIR': { 
      pattern: 'DIRECTIONAL', 
      colors: PALETTE_PURPLE, 
      count: [20, 30], 
      speed: [5, 10], 
      life: [0.5, 0.9],
      spread: 1.6,
      omniChance: 0.15   // Reduced to 15% (Half of 30%)
  },
  'EXPLOSION_YELLOW_DIR': { 
      pattern: 'DIRECTIONAL', 
      colors: PALETTE_YELLOW, 
      count: [15, 25], 
      speed: [10, 18], 
      life: [0.4, 0.8],
      spread: 1.6,
      omniChance: 0.15
  },
  'EXPLOSION_RED_DIR': { 
      pattern: 'DIRECTIONAL', 
      colors: PALETTE_RED, 
      count: [20, 35], 
      speed: [12, 22], 
      life: [0.6, 1.0],
      spread: 1.6,
      omniChance: 0.15 
  },

  // --- IMPACTS ---
  'IMPACT_WHITE': { pattern: 'RADIAL', colors: ['#FFFFFF'], count: [3, 5], speed: [2, 5], life: [0.1, 0.2] },
  'IMPACT_RED':   { pattern: 'RADIAL', colors: PALETTE_RED, count: [4, 7], speed: [3, 8], life: [0.2, 0.4] },
  'CLASH_YELLOW': { pattern: 'RADIAL', colors: PALETTE_YELLOW, count: [5, 8], speed: [5, 10], life: [0.2, 0.4] },

  // --- DIRECTIONAL (PURE) ---
  'DRILL_SPARKS':  { 
      pattern: 'DIRECTIONAL', 
      colors: PALETTE_PURPLE, 
      count: [3, 6], 
      speed: [10, 10], 
      life: [0.2, 0.4], 
      spread: 0.7, 
      size: [0.5, 0.5],
      shape: 1 
  },
  
  'HUNTER_RECOIL': { pattern: 'DIRECTIONAL', colors: PALETTE_YELLOW, count: [8, 12], speed: [10, 18], life: [0.3, 0.6], spread: 0.5 },
  
  'ENGINE_FLARE': { 
    pattern: 'DIRECTIONAL', 
    colors: ['#F7D277', '#FFFFFF'], 
    count: [3, 5], 
    speed: [15, 25], 
    life: [0.1, 0.2], 
    spread: 0.05 
  },

  // --- SPECIAL ---
  'REBOOT_HEAL': { pattern: 'RADIAL', colors: PALETTE_CYAN, count: [8, 12], speed: [2, 5], life: [0.5, 1.0] },
  'PURGE_BLAST': { pattern: 'RADIAL', colors: ['#FFFFFF', '#FF003C'], count: [50, 50], speed: [10, 30], life: [1.5, 2.5] }
};
