import { PanelId } from '@/engine/config/PanelConfig';

export interface RegisteredPanel {
  id: PanelId;
  element: HTMLElement;
  health: number;
  isDestroyed: boolean;
}

export interface SpitterState { // RENAMED
  girthLevel: number; // RENAMED from widthLevel
  damageLevel: number; 
  rateLevel: number; 
}

export interface SnifferState {
  capacityLevel: number; 
  damageLevel: number; 
  rateLevel: number; 
}

export type UpgradePath = 
  | 'SPITTER_GIRTH'   // RENAMED
  | 'SPITTER_DAMAGE'  // RENAMED
  | 'SPITTER_RATE'    // RENAMED
  | 'SNIFFER_CAPACITY'
  | 'SNIFFER_DAMAGE'
  | 'SNIFFER_RATE'
  | 'RESTORE'
  | 'PURGE';

export type UpgradeOption = {
    id: string;
    cost: number;
}

export interface GameState {
  isPlaying: boolean;
  score: number;
  panels: Record<string, RegisteredPanel>;
  
  // Slices
  highScore: number;
  upgradePoints: number;
  spitter: SpitterState; // RENAMED
  sniffer: SnifferState;

  startGame: () => void;
  stopGame: () => void;
  resetGame: () => void;
  
  // Combat Slice
  isZenMode: boolean;
  systemIntegrity: number;
  setPlaying: (isPlaying: boolean) => void;
  activateZenMode: () => void;
  setSystemIntegrity: (val: number) => void;
  resetCombatState: () => void;

  // Progression Slice
  setScore: (val: number) => void;
  selectUpgrade: (path: UpgradePath) => void;
  resetProgressionState: () => void;

  // UI Slice
  registerPanel: (id: PanelId, element: HTMLElement) => void;
  unregisterPanel: (id: PanelId) => void;
  setInteractionTarget: (id: PanelId | null) => void;
  healPanel: (id: PanelId, amount: number, sourceX?: number) => void;
  damagePanel: (id: PanelId, amount: number, options?: any) => void;
  decayPanel: (id: PanelId, amount: number) => void;
  restoreAllPanels: () => number;
  destroyAllPanels: () => void;
  resetUIState: () => void;
}
