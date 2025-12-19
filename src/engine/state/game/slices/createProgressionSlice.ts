import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { PLAYER_CONFIG } from '@/engine/config/PlayerConfig';
import { UpgradeOption } from '@/engine/types/game.types';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export interface ProgressionSlice {
  score: number;
  highScore: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  upgradePoints: number;
  activeUpgrades: Record<string, number>;
  setScore: (val: number) => void;
  setProgressionData: (data: { xp: number, level: number, nextXp: number, points: number }) => void;
  selectUpgrade: (option: UpgradeOption) => void;
  resetProgressionState: () => void;
}

export const createProgressionSlice: StateCreator<GameState, [], [], ProgressionSlice> = (set) => ({
  score: 0,
  highScore: 0,
  xp: 0,
  level: 1,
  xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
  upgradePoints: 0,
  activeUpgrades: { 
    'OVERCLOCK': 0, 
    'EXECUTE': 0, 
    'FORK': 0, 
    'SNIFFER': 0, 
    'BACKDOOR': 0, 
    'DAEMON': 0 
  },

  setScore: (val) => set((state) => {
      const newHigh = Math.max(state.highScore, val);
      return { score: val, highScore: newHigh };
  }),

  setProgressionData: (data) => set({
      xp: data.xp,
      level: data.level,
      xpToNextLevel: data.nextXp,
      upgradePoints: data.points
  }),

  selectUpgrade: (option) => {
    GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option });
  },

  resetProgressionState: () => set({
      score: 0,
      xp: 0,
      level: 1,
      xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
      upgradePoints: 0,
      activeUpgrades: { 
        'OVERCLOCK': 0, 
        'EXECUTE': 0, 
        'FORK': 0, 
        'SNIFFER': 0, 
        'BACKDOOR': 0, 
        'DAEMON': 0 
      }
  })
});
