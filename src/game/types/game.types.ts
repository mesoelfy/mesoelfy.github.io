export interface RegisteredPanel {
  id: string;
  element: HTMLElement;
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

// --- ENTITY TYPES ---

export interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  spawnTime: number; 
}

export interface Enemy extends Entity {
  vx: number;
  vy: number;
  hp: number;
  type: 'muncher' | 'kamikaze' | 'hunter';
  state?: 'orbit' | 'charge' | 'fire';
  stateTimer?: number;
  targetId?: string; 
  isEating?: boolean;
  orbitAngle?: number; 
}

export interface Bullet extends Entity {
  vx: number;
  vy: number;
  life: number;
  isEnemy?: boolean;
  hp: number; // NEW: Bullet durability
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}
