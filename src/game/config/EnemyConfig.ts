// src/game/config/EnemyConfig.ts

export const ENEMY_CONFIG = {
  muncher: {
    hp: 2,
    baseSpeed: 8,
    radius: 0.5,
    damage: 5,
    score: 10
  },
  kamikaze: {
    hp: 1,
    baseSpeed: 12,
    radius: 0.5,
    damage: 10,
    score: 20
  },
  hunter: {
    hp: 3,
    baseSpeed: 12,
    radius: 0.5,
    score: 50,
    orbitRadius: 12.5,
    orbitDuration: 2.0, // Base duration for orbit state
    chargeDuration: 1.0,
    fireRange: 12.0,
    offsetDistance: 1.6 // Distance from center to tip
  }
};

export const WAVE_CONFIG = {
  baseSpawnInterval: 0.8,
  difficultyScaler: 1.0 // How much threatLevel affects spawn rate
};
