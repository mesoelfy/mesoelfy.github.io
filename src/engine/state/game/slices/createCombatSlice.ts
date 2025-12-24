import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export interface CombatSlice {
  isPlaying: boolean;
  isZenMode: boolean;
  systemIntegrity: number;

  // Actions
  setPlaying: (isPlaying: boolean) => void;
  activateZenMode: () => void;
  
  // Setters
  setSystemIntegrity: (val: number) => void;
  
  resetCombatState: () => void;
}

export const createCombatSlice: StateCreator<GameState, [], [], CombatSlice> = (set, get) => ({
  isPlaying: false,
  isZenMode: false,
  systemIntegrity: 100,

  setPlaying: (isPlaying) => {
      if (isPlaying) get().resetGame();
      set({ isPlaying });
  },

  activateZenMode: () => {
    set({ isZenMode: true });
    GameEventBus.emit(GameEvents.ZEN_MODE_ENABLED, null);
  },

  setSystemIntegrity: (val) => set({ systemIntegrity: val }),

  resetCombatState: () => set({
      isPlaying: false,
      isZenMode: false,
      systemIntegrity: 100
  })
});
