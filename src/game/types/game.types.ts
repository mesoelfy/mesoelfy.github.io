export interface RegisteredPanel {
  id: string;
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
  registerPanel: (id: string, element: HTMLElement) => void;
  unregisterPanel: (id: string) => void;
  damagePanel: (id: string, amount: number) => void;
  healPanel: (id: string, amount: number) => void;
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  spawnTime: number; 
}
