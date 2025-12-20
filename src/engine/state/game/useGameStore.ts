import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/engine/config/StorageConfig';
import { GameStream } from '@/engine/state/GameStream';

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
      name: STORAGE_KEYS.GAME_STATE, 
      partialize: (state) => ({ highScore: state.highScore }), 
    }
  )
);

// --- REACTIVE BRIDGE ---
// Automatically syncs Zustand State -> GameStream (DOM/High-Freq)
useGameStore.subscribe((state) => {
  GameStream.set('PLAYER_HEALTH', state.playerHealth);
  GameStream.set('PLAYER_MAX_HEALTH', state.maxPlayerHealth);
  GameStream.set('PLAYER_REBOOT', state.playerRebootProgress);
  GameStream.set('SYSTEM_INTEGRITY', state.systemIntegrity);
  GameStream.set('SCORE', state.score);
  GameStream.set('XP', state.xp);
  GameStream.set('XP_NEXT', state.xpToNextLevel);
  GameStream.set('LEVEL', state.level);
});
