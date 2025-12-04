// src/game/events/GameEvents.ts

export type GameEventType = 
  // --- COMBAT EVENTS ---
  | 'PLAYER_FIRED'           // Payload: { x: number, y: number }
  | 'PLAYER_HIT'             // Payload: { damage: number }
  | 'ENEMY_SPAWNED'          // Payload: { type: string, id: number }
  | 'ENEMY_DAMAGED'          // Payload: { id: number, damage: number, type: string }
  | 'ENEMY_DESTROYED'        // Payload: { id: number, type: string, x: number, y: number }
  
  // --- PANEL EVENTS ---
  | 'PANEL_DAMAGED'          // Payload: { id: string, amount: number, currentHealth: number }
  | 'PANEL_HEALED'           // Payload: { id: string, amount: number }
  | 'PANEL_DESTROYED'        // Payload: { id: string }
  
  // --- SYSTEM EVENTS ---
  | 'GAME_START'             // Payload: null
  | 'GAME_OVER'              // Payload: { score: number }
  | 'THREAT_LEVEL_UP';       // Payload: { level: number }

export interface GameEventPayloads {
  PLAYER_FIRED: { x: number; y: number };
  PLAYER_HIT: { damage: number };
  ENEMY_SPAWNED: { type: string; id: number };
  ENEMY_DAMAGED: { id: number; damage: number; type: string };
  ENEMY_DESTROYED: { id: number; type: string; x: number; y: number };
  PANEL_DAMAGED: { id: string; amount: number; currentHealth: number };
  PANEL_HEALED: { id: string; amount: number };
  PANEL_DESTROYED: { id: string };
  GAME_START: null;
  GAME_OVER: { score: number };
  THREAT_LEVEL_UP: { level: number };
}
