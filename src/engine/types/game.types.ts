import { PanelId } from '@/engine/config/PanelConfig';

export interface RegisteredPanel {
  id: PanelId;
  element: HTMLElement;
  health: number;
  isDestroyed: boolean;
}

export type UpgradeOption = 
  | 'OVERCLOCK'      // Attack Speed
  | 'EXECUTE'        // Damage
  | 'FORK'           // Multishot
  | 'SNIFFER'        // Homing
  | 'BACKDOOR'       // Rear Guard
  | 'DAEMON'         // Summon Ally
  | 'REPAIR_NANITES' // Heal
  | 'RESTORE'        // System Op
  | 'PURGE';         // System Op

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
