import { COLOR_SETS, PALETTE } from '../Palette';

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
    count: [Math.floor(counts[0] * 0.75), Math.floor(counts[1] * 0.75)],
    speed: speeds,
    life: [0.4, 0.8]
  };
};

export const VFX_MANIFEST: Record<string, VFXRecipe> = {
  // Driller
  'EXPLOSION_PURPLE':     createExplosion(COLOR_SETS.PURPLE, false, [20, 30], [5, 10]),
  'EXPLOSION_PURPLE_DIR': createExplosion(COLOR_SETS.PURPLE, true,  [20, 30], [5, 10]),
  
  // Hunter
  'EXPLOSION_YELLOW':     createExplosion(COLOR_SETS.YELLOW, false, [15, 25], [10, 18]),
  'EXPLOSION_YELLOW_DIR': createExplosion(COLOR_SETS.YELLOW, true,  [15, 25], [10, 18]),
  
  // Kamikaze
  'EXPLOSION_RED':        createExplosion(COLOR_SETS.RED, false, [20, 35], [12, 22]),
  'EXPLOSION_RED_DIR':    createExplosion(COLOR_SETS.RED, true,  [20, 35], [12, 22]),

  // Custom / Unique FX
  'IMPACT_WHITE': { pattern: 'RADIAL', colors: COLOR_SETS.WHITE, count: [3, 5], speed: [2, 5], life: [0.1, 0.2] },
  'IMPACT_RED':   { pattern: 'RADIAL', colors: COLOR_SETS.RED, count: [4, 7], speed: [3, 8], life: [0.2, 0.4] },
  'CLASH_YELLOW': { pattern: 'RADIAL', colors: COLOR_SETS.YELLOW, count: [5, 8], speed: [5, 10], life: [0.2, 0.4] },
  
  'DRILL_SPARKS':  { 
      pattern: 'DIRECTIONAL', 
      colors: COLOR_SETS.PURPLE, 
      count: [3, 6], 
      speed: [10, 10], 
      life: [0.1, 0.2], 
      spread: 0.7, 
      size: [0.5, 0.5],
      shape: 1 
  },
  
  'HUNTER_RECOIL': { pattern: 'DIRECTIONAL', colors: COLOR_SETS.YELLOW, count: [8, 12], speed: [10, 18], life: [0.3, 0.6], spread: 0.5 },
  
  'ENGINE_FLARE': { 
    pattern: 'DIRECTIONAL', 
    colors: [PALETTE.YELLOW.SOFT, PALETTE.MONO.WHITE], 
    count: [3, 5], 
    speed: [15, 25], 
    life: [0.1, 0.2], 
    spread: 0.05 
  },
  
  // REBOOT_HEAL is now PINK
  'REBOOT_HEAL': { pattern: 'RADIAL', colors: COLOR_SETS.PINK, count: [8, 12], speed: [2, 5], life: [0.5, 1.0] },
  'PURGE_BLAST': { pattern: 'RADIAL', colors: [PALETTE.MONO.WHITE, PALETTE.RED.CRITICAL], count: [50, 50], speed: [10, 30], life: [1.5, 2.5] }
};
