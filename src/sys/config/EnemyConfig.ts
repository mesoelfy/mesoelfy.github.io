import { EnemyTypes } from './Identifiers';

export const ENEMY_CONFIG = {
  [EnemyTypes.DRILLER]: { 
    hp: 1,             // One shot
    baseSpeed: 8,
    radius: 0.5,
    damage: 1,         // Chip damage
    score: 10
  },
  [EnemyTypes.KAMIKAZE]: {
    hp: 2,             // Two shots
    baseSpeed: 12,
    radius: 0.6,
    damage: 3,         // Heavy hit
    score: 20
  },
  [EnemyTypes.HUNTER]: {
    hp: 3,             // Three shots
    baseSpeed: 12,
    radius: 0.5,
    score: 50,
    orbitRadius: 12.5,
    orbitDuration: 2.0,
    chargeDuration: 1.0,
    fireRange: 12.0,
    offsetDistance: 1.6 
  }
};

export const WAVE_CONFIG = {
  baseSpawnInterval: 0.8,
  difficultyScaler: 1.0 
};
