import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { PLAYER_CONFIG } from '@/sys/config/PlayerConfig';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export interface CombatSlice {
  isPlaying: boolean;
  isZenMode: boolean;
  playerHealth: number;
  maxPlayerHealth: number;
  playerRebootProgress: number;
  systemIntegrity: number;

  startGame: () => void;
  stopGame: () => void;
  activateZenMode: () => void;
  
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  tickPlayerReboot: (amount: number) => void;
  decayReboot: (amount: number) => void;
  
  resetCombatState: () => void;
}

export const createCombatSlice: StateCreator<GameState, [], [], CombatSlice> = (set, get) => ({
  isPlaying: false,
  isZenMode: false,
  playerHealth: PLAYER_CONFIG.maxHealth,
  maxPlayerHealth: PLAYER_CONFIG.maxHealth,
  playerRebootProgress: 0,
  systemIntegrity: 100,

  startGame: () => {
    if (get().isPlaying) return;
    // When game starts, we also reset progression/combat state to baseline
    // But we trigger the other slices via the composed reset in the main store or here.
    // For now, we set local flags.
    get().resetGame(); // Calls the composed reset
    set({ isPlaying: true });
  },

  stopGame: () => {
    const { score, highScore } = get(); // Access Progression Slice
    set({ 
        isPlaying: false, 
        highScore: Math.max(score, highScore) 
    });
  },

  activateZenMode: () => {
    set({ isZenMode: true });
    GameEventBus.emit(GameEvents.ZEN_MODE_ENABLED, null);
  },

  damagePlayer: (amount) => set((state) => ({ 
      playerHealth: Math.max(0, state.playerHealth - amount) 
  })),

  healPlayer: (amount) => set((state) => ({ 
      playerHealth: Math.min(state.maxPlayerHealth, state.playerHealth + amount) 
  })),

  tickPlayerReboot: (amount) => set((state) => ({ 
      playerRebootProgress: Math.min(100, Math.max(0, state.playerRebootProgress + amount)) 
  })),

  decayReboot: (amount) => set((state) => ({ 
      playerRebootProgress: Math.max(0, state.playerRebootProgress - amount) 
  })),

  resetCombatState: () => set({
      isPlaying: false,
      isZenMode: false,
      playerHealth: PLAYER_CONFIG.maxHealth,
      playerRebootProgress: 0,
      systemIntegrity: 100
  })
});
