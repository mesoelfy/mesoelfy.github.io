export type VFXPattern = 'RADIAL' | 'DIRECTIONAL';

export interface VFXRecipe {
  pattern: VFXPattern;
  colors: string[];
  count: [number, number];
  speed: [number, number];
  life: [number, number];
  spread?: number;
  size?: [number, number];
  shape?: number; 
  omniChance?: number; 
}

// --- 1. DEFINE PALETTES ---
const PALETTES = {
  PURPLE: ['#9E4EA5', '#D0A3D8', '#E0B0FF', '#7A2F8F', '#B57EDC'],
  YELLOW: ['#F7D277', '#FFE5A0', '#FFA500', '#FFFFFF'],
  RED:    ['#FF003C', '#FF4D6D', '#800010'],
  CYAN:   ['#00F0FF', '#008ba3', '#FFFFFF'],
  WHITE:  ['#FFFFFF']
};

// --- 2. DEFINE FACTORIES (Restoring "Weight" Parameters) ---
const createExplosion = (
    colors: string[], 
    isDirectional: boolean,
    counts: [number, number],
    speeds: [number, number]
): VFXRecipe => {
  if (isDirectional) {
    return {
      pattern: 'DIRECTIONAL',
      colors: colors,
      count: counts,
      speed: speeds,
      life: [0.5, 0.9],
      spread: 1.6,
      omniChance: 0.15
    };
  }
  return {
    pattern: 'RADIAL',
    colors: colors,
    count: [Math.floor(counts[0] * 0.75), Math.floor(counts[1] * 0.75)], // Radial is usually smaller
    speed: speeds,
    life: [0.4, 0.8]
  };
};

// --- 3. GENERATE RECIPES ---
export const VFX_RECIPES: Record<string, VFXRecipe> = {
  // Driller: Medium Count, Medium Speed
  'EXPLOSION_PURPLE':     createExplosion(PALETTES.PURPLE, false, [20, 30], [5, 10]),
  'EXPLOSION_PURPLE_DIR': createExplosion(PALETTES.PURPLE, true,  [20, 30], [5, 10]),
  
  // Hunter: Lower Count, Higher Speed (Snappy)
  'EXPLOSION_YELLOW':     createExplosion(PALETTES.YELLOW, false, [15, 25], [10, 18]),
  'EXPLOSION_YELLOW_DIR': createExplosion(PALETTES.YELLOW, true,  [15, 25], [10, 18]),
  
  // Kamikaze: Max Count, Max Speed (Violent)
  'EXPLOSION_RED':        createExplosion(PALETTES.RED, false, [20, 35], [12, 22]),
  'EXPLOSION_RED_DIR':    createExplosion(PALETTES.RED, true,  [20, 35], [12, 22]),

  // Custom / Unique FX
  'IMPACT_WHITE': { pattern: 'RADIAL', colors: PALETTES.WHITE, count: [3, 5], speed: [2, 5], life: [0.1, 0.2] },
  'IMPACT_RED':   { pattern: 'RADIAL', colors: PALETTES.RED, count: [4, 7], speed: [3, 8], life: [0.2, 0.4] },
  'CLASH_YELLOW': { pattern: 'RADIAL', colors: PALETTES.YELLOW, count: [5, 8], speed: [5, 10], life: [0.2, 0.4] },
  
  'DRILL_SPARKS':  { 
      pattern: 'DIRECTIONAL', 
      colors: PALETTES.PURPLE, 
      count: [3, 6], 
      speed: [10, 10], 
      life: [0.2, 0.4], 
      spread: 0.7, 
      size: [0.5, 0.5],
      shape: 1 
  },
  
  'HUNTER_RECOIL': { pattern: 'DIRECTIONAL', colors: PALETTES.YELLOW, count: [8, 12], speed: [10, 18], life: [0.3, 0.6], spread: 0.5 },
  
  'ENGINE_FLARE': { 
    pattern: 'DIRECTIONAL', 
    colors: ['#F7D277', '#FFFFFF'], 
    count: [3, 5], 
    speed: [15, 25], 
    life: [0.1, 0.2], 
    spread: 0.05 
  },
  
  'REBOOT_HEAL': { pattern: 'RADIAL', colors: PALETTES.CYAN, count: [8, 12], speed: [2, 5], life: [0.5, 1.0] },
  'PURGE_BLAST': { pattern: 'RADIAL', colors: ['#FFFFFF', '#FF003C'], count: [50, 50], speed: [10, 30], life: [1.5, 2.5] }
};
