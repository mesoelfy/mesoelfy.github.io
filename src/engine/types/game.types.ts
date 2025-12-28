import { PanelId } from '@/engine/config/PanelConfig';

export interface RegisteredPanel {
  id: PanelId;
  element: HTMLElement;
  health: number;
  isDestroyed: boolean;
}

export interface RailgunState {
  widthLevel: number; // 0-10
  damageLevel: number; // 0-3
  rateLevel: number; // 0-3
}

export interface SnifferState {
  capacityLevel: number; // 0-4
  damageLevel: number; // 0-3
  rateLevel: number; // 0-3
}

// Replaces the old string-based keys
export type UpgradePath = 
  | 'RAILGUN_WIDTH'
  | 'RAILGUN_DAMAGE'
  | 'RAILGUN_RATE'
  | 'SNIFFER_CAPACITY'
  | 'SNIFFER_DAMAGE'
  | 'SNIFFER_RATE'
  | 'REPAIR_NANITES' // Kept for logic compatibility if needed, though button removed
  | 'RESTORE'
  | 'PURGE'
  | 'DAEMON'; // Kept as deprecated reference or for event compatibility

export interface GameState {
  isPlaying: boolean;
  score: number;
  threatLevel: number;
  panels: Record<string, RegisteredPanel>;
  
  startGame: () => void;
  stopGame: () => void;
  registerPanel: (id: PanelId, element: HTMLElement) => void;
  unregisterPanel: (id: PanelId) => void;
  damagePanel: (id: PanelId, amount: number) => void;
  healPanel: (id: PanelId, amount: number) => void;
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  spawnTime: number; 
}
