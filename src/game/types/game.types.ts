export interface RegisteredPanel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number; // 0-100
  isDestroyed: boolean;
}

export interface GameState {
  isPlaying: boolean;
  score: number;
  threatLevel: number; // 1-10, controls spawn rate
  panels: Record<string, RegisteredPanel>; // Map of ID -> Panel Data
  
  // Actions
  startGame: () => void;
  stopGame: () => void;
  registerPanel: (id: string, rect: DOMRect) => void;
  updatePanelRect: (id: string, rect: DOMRect) => void;
  damagePanel: (id: string, amount: number) => void;
}
