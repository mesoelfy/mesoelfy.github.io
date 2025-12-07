export enum GameEvents {
  // --- COMBAT ---
  PLAYER_FIRED = 'PLAYER_FIRED',
  PLAYER_HIT = 'PLAYER_HIT',
  ENEMY_SPAWNED = 'ENEMY_SPAWNED',
  ENEMY_DAMAGED = 'ENEMY_DAMAGED',
  ENEMY_DESTROYED = 'ENEMY_DESTROYED',
  PROJECTILE_CLASH = 'PROJECTILE_CLASH',
  
  // --- PANEL ---
  PANEL_DAMAGED = 'PANEL_DAMAGED',
  PANEL_HEALED = 'PANEL_HEALED',
  PANEL_DESTROYED = 'PANEL_DESTROYED',
  
  // --- SYSTEM ---
  GAME_START = 'GAME_START',
  GAME_OVER = 'GAME_OVER',
  THREAT_LEVEL_UP = 'THREAT_LEVEL_UP',
  UPGRADE_SELECTED = 'UPGRADE_SELECTED',
  ZEN_MODE_ENABLED = 'ZEN_MODE_ENABLED',
  
  // --- DEBUG ---
  DEBUG_SPAWN = 'DEBUG_SPAWN', // NEW
  
  // --- VISUAL ---
  TRAUMA_ADDED = 'TRAUMA_ADDED',
  SCENE_READY = 'SCENE_READY'
}

export interface GameEventPayloads {
  [GameEvents.PLAYER_FIRED]: { x: number; y: number };
  [GameEvents.PLAYER_HIT]: { damage: number };
  [GameEvents.ENEMY_SPAWNED]: { type: string; id: number };
  [GameEvents.ENEMY_DAMAGED]: { id: number; damage: number; type: string };
  [GameEvents.ENEMY_DESTROYED]: { id: number; type: string; x: number; y: number };
  [GameEvents.PROJECTILE_CLASH]: { x: number; y: number };
  
  [GameEvents.PANEL_DAMAGED]: { id: string; amount: number; currentHealth: number };
  [GameEvents.PANEL_HEALED]: { id: string; amount: number };
  [GameEvents.PANEL_DESTROYED]: { id: string };
  
  [GameEvents.GAME_START]: null;
  [GameEvents.GAME_OVER]: { score: number };
  [GameEvents.THREAT_LEVEL_UP]: { level: number };
  [GameEvents.UPGRADE_SELECTED]: { option: string };
  [GameEvents.ZEN_MODE_ENABLED]: null;
  
  [GameEvents.DEBUG_SPAWN]: { type: string; count: number }; // NEW
  
  [GameEvents.TRAUMA_ADDED]: { amount: number };
  [GameEvents.SCENE_READY]: null;
}
