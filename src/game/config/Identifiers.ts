export const EnemyTypes = {
  MUNCHER: 'muncher',
  KAMIKAZE: 'kamikaze',
  HUNTER: 'hunter',
} as const;

export type EnemyType = typeof EnemyTypes[keyof typeof EnemyTypes];

export const GameEvents = {
  ENEMY_SPAWNED: 'ENEMY_SPAWNED',
  ENEMY_DAMAGED: 'ENEMY_DAMAGED',
  ENEMY_DESTROYED: 'ENEMY_DESTROYED',
  PLAYER_HIT: 'PLAYER_HIT',
  PLAYER_FIRED: 'PLAYER_FIRED',
  PROJECTILE_CLASH: 'PROJECTILE_CLASH',
  PANEL_DAMAGED: 'PANEL_DAMAGED',
  PANEL_HEALED: 'PANEL_HEALED',
  PANEL_DESTROYED: 'PANEL_DESTROYED',
} as const;
