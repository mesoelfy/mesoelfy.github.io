import { EnemyTypes } from './Identifiers';

export const ENEMY_CONFIG = {
  [EnemyTypes.MUNCHER]: {
    hp: 2,
    baseSpeed: 8,
    radius: 0.5,
    damage: 5,
    score: 10
  },
  [EnemyTypes.KAMIKAZE]: {
    hp: 3, // TRIPLED HEALTH (Was 1)
    baseSpeed: 12,
    radius: 0.5,
    damage: 10,
    score: 20
  },
  [EnemyTypes.HUNTER]: {
    hp: 3,
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
