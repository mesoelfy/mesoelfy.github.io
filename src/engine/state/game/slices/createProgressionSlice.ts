import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { UpgradeOption } from '@/engine/types/game.types';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export interface ProgressionSlice {
  highScore: number;
  upgradePoints: number;
  activeUpgrades: Record<string, number>;
  
  setScore: (val: number) => void; // Updates high score
  setActiveUpgrades: (upgrades: Record<string, number>) => void;
  selectUpgrade: (option: UpgradeOption) => void;
  resetProgressionState: () => void;
}

export const createProgressionSlice: StateCreator<GameState, [], [], ProgressionSlice> = (set) => ({
  highScore: 0,
  upgradePoints: 0,
  activeUpgrades: { 
    'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0, 
    'SNIFFER': 0, 'BACKDOOR': 0, 'DAEMON': 0 
  },

  setScore: (val) => set((state) => {
      const newHigh = Math.max(state.highScore, val);
      return { highScore: newHigh };
  }),

  setActiveUpgrades: (upgrades) => set({ activeUpgrades: { ...upgrades } }),

  selectUpgrade: (option) => {
    GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option });
  },

  resetProgressionState: () => set({
      upgradePoints: 0,
      activeUpgrades: { 
        'OVERCLOCK': 0, 'EXECUTE': 0, 'FORK': 0, 
        'SNIFFER': 0, 'BACKDOOR': 0, 'DAEMON': 0 
      }
  })
});
