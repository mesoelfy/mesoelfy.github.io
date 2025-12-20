import { EnemyDef } from './types';
import { PALETTE } from '@/engine/config/Palette';

export const ENEMIES: Record<string, EnemyDef> = {
  'driller': {
    id: 'driller',
    health: 1, damage: 1, score: 100, xp: 10,
    ai: 'driller',
    physics: { radius: 0.4, mass: 1.0, friction: 0.0 },
    visual: { 
      model: 'CONE', 
      color: PALETTE.PURPLE.PRIMARY, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE',
      height: 0.64, radius: 0.24, segments: 4
    },
    params: { spawnOffset: 0.32 }
  },
  'kamikaze': {
    id: 'kamikaze',
    health: 2, damage: 3, score: 200, xp: 20,
    ai: 'kamikaze',
    physics: { radius: 0.7, mass: 0.8, friction: 0.0 },
    visual: { 
      model: 'ICOSA', 
      color: PALETTE.RED.CRITICAL, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE', 
      radius: 0.69, detail: 0 
    }
  },
  'hunter': {
    id: 'hunter',
    health: 3, damage: 10, score: 300, xp: 30,
    ai: 'hunter',
    physics: { radius: 0.74, mass: 1.2, friction: 0.0 },
    visual: { 
      model: 'CUSTOM_HUNTER', 
      color: PALETTE.YELLOW.SOFT, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE'
    }
  },
  'daemon': {
    id: 'daemon',
    health: 100, damage: 0, score: 0, xp: 0,
    ai: 'daemon',
    physics: { radius: 0.6, mass: 5.0, friction: 0.0 },
    visual: { 
      model: 'OCTA', 
      color: PALETTE.CYAN.PRIMARY, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE'
    }
  }
};
