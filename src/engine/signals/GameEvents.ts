export enum GameEvents {
  PLAYER_FIRED = 'PLAYER_FIRED',
  PLAYER_HIT = 'PLAYER_HIT',
  ENEMY_SPAWNED = 'ENEMY_SPAWNED',
  ENEMY_DAMAGED = 'ENEMY_DAMAGED',
  ENEMY_DESTROYED = 'ENEMY_DESTROYED',
  PROJECTILE_CLASH = 'PROJECTILE_CLASH',
  PANEL_DAMAGED = 'PANEL_DAMAGED',
  PANEL_HEALED = 'PANEL_HEALED',
  PANEL_RESTORED = 'PANEL_RESTORED',
  PANEL_DESTROYED = 'PANEL_DESTROYED',
  GAME_START = 'GAME_START',
  GAME_OVER = 'GAME_OVER',
  THREAT_LEVEL_UP = 'THREAT_LEVEL_UP',
  UPGRADE_SELECTED = 'UPGRADE_SELECTED',
  ZEN_MODE_ENABLED = 'ZEN_MODE_ENABLED',
  DEBUG_SPAWN = 'DEBUG_SPAWN',
  TRAUMA_ADDED = 'TRAUMA_ADDED',
  SCENE_READY = 'SCENE_READY',
  SPAWN_FX = 'SPAWN_FX',
  SPAWN_DAEMON = 'SPAWN_DAEMON',
  HEARTBEAT = 'HEARTBEAT',
  LOG_DEBUG = 'LOG_DEBUG',
  BOOT_LOG = 'BOOT_LOG',
  PLAYER_REBOOT_TICK = 'PLAYER_REBOOT_TICK',   // NEW
  PLAYER_REBOOT_DECAY = 'PLAYER_REBOOT_DECAY' // NEW
}

export type FXVariant = 
  | 'EXPLOSION_PURPLE' 
  | 'EXPLOSION_YELLOW' 
  | 'EXPLOSION_RED'
  | 'IMPACT_WHITE'
  | 'IMPACT_RED'
  | 'IMPACT_YELLOW'
  | 'DRILL_SPARKS'
  | 'HUNTER_RECOIL'
  | 'CLASH_YELLOW';

export interface GameEventPayloads {
  [GameEvents.PLAYER_FIRED]: { x: number; y: number };
  [GameEvents.PLAYER_HIT]: { damage: number };
  [GameEvents.ENEMY_SPAWNED]: { type: string; id: number };
  [GameEvents.ENEMY_DAMAGED]: { id: number; damage: number; type: string };
  [GameEvents.ENEMY_DESTROYED]: { id: number; type: string; x: number; y: number };
  [GameEvents.PROJECTILE_CLASH]: { x: number; y: number };
  [GameEvents.PANEL_DAMAGED]: { id: string; amount: number; currentHealth: number };
  [GameEvents.PANEL_HEALED]: { id: string; amount: number };
  [GameEvents.PANEL_RESTORED]: { id: string; x?: number }; 
  [GameEvents.PANEL_DESTROYED]: { id: string };
  [GameEvents.GAME_START]: null;
  [GameEvents.GAME_OVER]: { score: number };
  [GameEvents.THREAT_LEVEL_UP]: { level: number };
  [GameEvents.UPGRADE_SELECTED]: { option: string };
  [GameEvents.ZEN_MODE_ENABLED]: null;
  [GameEvents.DEBUG_SPAWN]: { type: string; count: number };
  [GameEvents.TRAUMA_ADDED]: { amount: number };
  [GameEvents.SCENE_READY]: null;
  [GameEvents.SPAWN_FX]: { type: FXVariant; x: number; y: number; angle?: number; count?: number; };
  [GameEvents.SPAWN_DAEMON]: null;
  [GameEvents.HEARTBEAT]: { urgency: number };
  [GameEvents.LOG_DEBUG]: { msg: string; source?: string };
  [GameEvents.BOOT_LOG]: { message: string };
  [GameEvents.PLAYER_REBOOT_TICK]: { amount: number };   // NEW
  [GameEvents.PLAYER_REBOOT_DECAY]: { amount: number }; // NEW
}
