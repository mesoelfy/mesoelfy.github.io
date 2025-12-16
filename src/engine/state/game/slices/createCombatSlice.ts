import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export interface CombatSlice {
  isPlaying: boolean;
  isZenMode: boolean;
  playerHealth: number;
  maxPlayerHealth: number;
  playerRebootProgress: number;
  systemIntegrity: number;

  // Actions
  setPlaying: (isPlaying: boolean) => void;
  activateZenMode: () => void;
  
  // Setters (Called by ECS)
  setPlayerHealth: (val: number) => void;
  setPlayerRebootProgress: (val: number) => void;
  setSystemIntegrity: (val: number) => void;
  
  resetCombatState: () => void;
}

export const createCombatSlice: StateCreator<GameState, [], [], CombatSlice> = (set, get) => ({
  isPlaying: false,
  isZenMode: false,
  playerHealth: PLAYER_CONFIG.maxHealth,
  maxPlayerHealth: PLAYER_CONFIG.maxHealth,
  playerRebootProgress: 0,
  systemIntegrity: 100,

  setPlaying: (isPlaying) => {
      if (isPlaying) get().resetGame();
      set({ isPlaying });
  },

  activateZenMode: () => {
    set({ isZenMode: true });
    GameEventBus.emit(GameEvents.ZEN_MODE_ENABLED, null);
  },

  // DUMB SETTERS - No Logic Allowed
  setPlayerHealth: (val) => set({ playerHealth: val }),
  setPlayerRebootProgress: (val) => set({ playerRebootProgress: val }),
  setSystemIntegrity: (val) => set({ systemIntegrity: val }),

  resetCombatState: () => set({
      isPlaying: false,
      isZenMode: false,
      playerHealth: PLAYER_CONFIG.maxHealth,
      playerRebootProgress: 0,
      systemIntegrity: 100
  })
});
