import { EnemyDef } from './types';
import { PALETTE } from '@/engine/config/Palette';
import { EnemyTypes, EnemyType } from '@/engine/config/Identifiers';

export const ENEMIES: Record<EnemyType, EnemyDef> = {
  [EnemyTypes.DRILLER]: {
    id: EnemyTypes.DRILLER,
    health: 1, damage: 0.75, score: 100, xp: 10,
    ai: 'driller',
    physics: { radius: 0.4, mass: 1.0, friction: 0.0 },
    visual: { 
      model: 'CONE', 
      color: PALETTE.PURPLE.INDIGO, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE',
      height: 0.64, radius: 0.24, segments: 4
    },
    params: { 
        spawnOffset: 0.32,
        spawnDuration: 1.5,
        approachSpeed: 8.0,
        approachStopDist: 1.2,
        drillInterval: 0.08
    }
  },
  [EnemyTypes.KAMIKAZE]: {
    id: EnemyTypes.KAMIKAZE,
    health: 4, damage: 3, score: 200, xp: 20,
    ai: 'kamikaze',
    physics: { radius: 0.7, mass: 0.8, friction: 0.0 },
    visual: { 
      model: 'ICOSA', 
      color: PALETTE.RED.CRITICAL, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE', 
      radius: 0.69, detail: 0 
    },
    params: {
        spawnDuration: 1.5,
        spinSpeed: 10.0,
        moveSpeed: 12.0
    }
  },
  [EnemyTypes.HUNTER]: {
    id: EnemyTypes.HUNTER,
    health: 3, damage: 10, score: 300, xp: 30,
    ai: 'hunter',
    physics: { radius: 0.74, mass: 1.2, friction: 0.0 },
    visual: { 
      model: 'CUSTOM_HUNTER', 
      color: PALETTE.ORANGE.PRIMARY, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE'
    },
    params: {
        spawnDuration: 1.5,
        roamSpeed: 12.0,
        roamPadding: 1.0,
        aimDuration: 1.2,
        projectileSpeed: 40.0,
        cooldownMin: 0.3,
        cooldownMax: 0.6
    }
  },
  [EnemyTypes.DAEMON]: {
    id: EnemyTypes.DAEMON,
    health: 100, damage: 0, score: 0, xp: 0,
    ai: 'daemon',
    physics: { radius: 0.6, mass: 5.0, friction: 0.0 },
    visual: { 
      model: 'OCTA', 
      color: PALETTE.PINK.PRIMARY, 
      scale: [1, 1, 1], 
      material: 'ENEMY_BASE'
    },
    params: {
        spawnDuration: 1.0,
        chargeDuration: 2.0,
        fireSpeed: 35.0,
        fireDamage: 20,
        waitDuration: 0.5
    }
  }
};
