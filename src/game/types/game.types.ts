export interface RegisteredPanel {
  id: string;
  element: HTMLElement; // Holds the live DOM reference
  health: number;
  isDestroyed: boolean;
}

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
