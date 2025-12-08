export interface RegisteredPanel {
  id: string;
  element: HTMLElement;
  health: number;
  isDestroyed: boolean;
}

export type UpgradeOption = 
  | 'OVERCLOCK'      // Attack Speed
  | 'ROOT_ACCESS'    // Damage
  | 'BANDWIDTH'      // Width (Renamed from FAT_PIPE)
  | 'PARALLEL_PROC'  // Multishot
  | 'REPAIR_NANITES'; // Heal

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
