import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Slices
import { createCombatSlice, CombatSlice } from './slices/createCombatSlice';
import { createProgressionSlice, ProgressionSlice } from './slices/createProgressionSlice';
import { createUISlice, UISlice } from './slices/createUISlice';

// Combined State Type
export type GameState = CombatSlice & ProgressionSlice & UISlice & {
  // Global Actions that touch multiple slices
  syncGameState: (data: Partial<GameState>) => void;
  resetGame: () => void;
  recalculateIntegrity: () => void; // Legacy hook
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get, api) => ({
      ...createCombatSlice(set, get, api),
      ...createProgressionSlice(set, get, api),
      ...createUISlice(set, get, api),

      // --- BRIDGE ACTIONS ---

      // Called by UISyncSystem (ECS) to update React State
      syncGameState: (data) => set((state) => ({ ...state, ...data })),

      // Master Reset
      resetGame: () => {
          get().resetCombatState();
          get().resetProgressionState();
          get().resetUIState();
      },

      // Legacy/Placeholder
      recalculateIntegrity: () => {},
    }),
    {
      name: 'mesoelfy-os-storage-v3', // Bump version for clean state
      partialize: (state) => ({ highScore: state.highScore }), // Only persist High Score
    }
  )
);
