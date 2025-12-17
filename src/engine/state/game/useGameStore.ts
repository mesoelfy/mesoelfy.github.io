import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Slices
import { createCombatSlice, CombatSlice } from './slices/createCombatSlice';
import { createProgressionSlice, ProgressionSlice } from './slices/createProgressionSlice';
import { createUISlice, UISlice } from './slices/createUISlice';

export type GameState = CombatSlice & ProgressionSlice & UISlice & {
  resetGame: () => void;
  startGame: () => void;
  stopGame: () => void;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get, api) => ({
      ...createCombatSlice(set, get, api),
      ...createProgressionSlice(set, get, api),
      ...createUISlice(set, get, api),

      startGame: () => {
          get().resetGame();
          get().setPlaying(true);
      },

      stopGame: () => {
          get().setPlaying(false);
      },

      resetGame: () => {
          get().resetCombatState();
          get().resetProgressionState();
          get().resetUIState();
      },
    }),
    {
      name: 'mesoelfy-os-storage-v3', 
      partialize: (state) => ({ highScore: state.highScore }), 
    }
  )
);
