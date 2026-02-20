import { PanelId } from '@/engine/config/PanelConfig';

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
  PURGE_COMPLETE = 'PURGE_COMPLETE',
  
  DEBUG_SPAWN = 'DEBUG_SPAWN',
  LOG_DEBUG = 'LOG_DEBUG',
  BOOT_LOG = 'BOOT_LOG',
  
  TRAUMA_ADDED = 'TRAUMA_ADDED',
  SPAWN_FX = 'SPAWN_FX',
  SPAWN_IMPACT = 'SPAWN_IMPACT',
  PLAY_SOUND = 'PLAY_SOUND',
  
  SPAWN_DAEMON = 'SPAWN_DAEMON',
  HEARTBEAT = 'HEARTBEAT',
  
  PLAYER_REBOOT_TICK = 'PLAYER_REBOOT_TICK',
  PLAYER_REBOOT_DECAY = 'PLAYER_REBOOT_DECAY',

  // --- UI BRIDGE COMMANDS ---
  CMD_REGISTER_PANEL = 'CMD_REGISTER_PANEL',
  CMD_UNREGISTER_PANEL = 'CMD_UNREGISTER_PANEL',
  CMD_DAMAGE_PANEL = 'CMD_DAMAGE_PANEL',
  CMD_HEAL_PANEL = 'CMD_HEAL_PANEL',
  CMD_DECAY_PANEL = 'CMD_DECAY_PANEL',
  CMD_DESTROY_ALL_PANELS = 'CMD_DESTROY_ALL_PANELS',
  CMD_SET_INTERACTION_TARGET = 'CMD_SET_INTERACTION_TARGET',
  CMD_SET_SCORE = 'CMD_SET_SCORE',

  // --- STATE SYNC ---
  GLOBAL_STATE_SYNC = 'GLOBAL_STATE_SYNC'
}

export type FXVariant = 
  | 'EXPLOSION_PURPLE' 
  | 'EXPLOSION_YELLOW' 
  | 'EXPLOSION_RED'
  | 'IMPACT_WHITE'
  | 'IMPACT_RED'
  | 'DRILL_SPARKS'
  | 'HUNTER_RECOIL'
  | 'CLASH_YELLOW'
  | 'REBOOT_HEAL'
  | 'PURGE_BLAST'
  | 'ENGINE_FLARE'
  | 'EXPLOSION_PURPLE_DIR'
  | 'EXPLOSION_YELLOW_DIR'
  | 'EXPLOSION_RED_DIR';

export interface GameEventPayloads {
  [GameEvents.PLAYER_FIRED]: { x: number; y: number; angle: number };
  [GameEvents.PLAYER_HIT]: { damage: number };
  [GameEvents.ENEMY_SPAWNED]: { type: string; id: number };
  [GameEvents.ENEMY_DAMAGED]: { id: number; damage?: number; type?: string };
  [GameEvents.ENEMY_DESTROYED]: { id: number; type: string; x: number; y: number };
  [GameEvents.PROJECTILE_CLASH]: { x: number; y: number };
  
  [GameEvents.PANEL_DAMAGED]: { id: PanelId; amount: number; currentHealth: number; sourceX?: number; sourceY?: number };
  [GameEvents.PANEL_HEALED]: { id: PanelId; amount: number };
  [GameEvents.PANEL_RESTORED]: { id: PanelId; x?: number }; 
  [GameEvents.PANEL_DESTROYED]: { id: PanelId };
  
  [GameEvents.GAME_START]: null;
  [GameEvents.GAME_OVER]: { score: number };
  
  [GameEvents.THREAT_LEVEL_UP]: { level: number };
  [GameEvents.UPGRADE_SELECTED]: { option: string };
  [GameEvents.ZEN_MODE_ENABLED]: null;
  [GameEvents.PURGE_COMPLETE]: null;
  
  [GameEvents.DEBUG_SPAWN]: { type: string; count: number };
  [GameEvents.LOG_DEBUG]: { msg: string; source?: string };
  [GameEvents.BOOT_LOG]: { message: string };
  
  [GameEvents.TRAUMA_ADDED]: { amount: number };
  [GameEvents.SPAWN_FX]: { type: string; x: number; y: number; angle?: number };
  [GameEvents.SPAWN_IMPACT]: { x: number; y: number; hexColor: string; angle: number };
  [GameEvents.PLAY_SOUND]: { key: string; x?: number };
  
  [GameEvents.SPAWN_DAEMON]: null;
  [GameEvents.HEARTBEAT]: { urgency: number };
  
  [GameEvents.PLAYER_REBOOT_TICK]: { amount: number };
  [GameEvents.PLAYER_REBOOT_DECAY]: { amount: number };

  // --- UI BRIDGE COMMANDS ---
  [GameEvents.CMD_REGISTER_PANEL]: { id: PanelId; element: HTMLElement };
  [GameEvents.CMD_UNREGISTER_PANEL]: { id: PanelId };
  [GameEvents.CMD_DAMAGE_PANEL]: { id: PanelId; amount: number; options?: any };
  [GameEvents.CMD_HEAL_PANEL]: { id: PanelId; amount: number; sourceX?: number };
  [GameEvents.CMD_DECAY_PANEL]: { id: PanelId; amount: number };
  [GameEvents.CMD_DESTROY_ALL_PANELS]: null;
  [GameEvents.CMD_SET_INTERACTION_TARGET]: { id: PanelId | null };
  [GameEvents.CMD_SET_SCORE]: { score: number };

  // --- STATE SYNC ---
  [GameEvents.GLOBAL_STATE_SYNC]: {
    bootState: string;
    isZenMode: boolean;
    graphicsMode: string;
    debugFlags: {
      godMode: boolean;
      panelGodMode: boolean;
      peaceMode: boolean;
      timeScale: number;
    };
  };
}
