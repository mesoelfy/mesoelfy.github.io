import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { PLAYER_CONFIG } from '@/game/config/PlayerConfig';
import { UpgradeOption } from '@/game/types/game.types';
import { GameEventBus } from '@/core/signals/GameEventBus';
import { GameEvents } from '@/core/signals/GameEvents';

export interface ProgressionSlice {
  score: number;
  highScore: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  upgradePoints: number;
  activeUpgrades: Record<string, number>;

  // Setters (Called by ECS)
  setScore: (val: number) => void;
  setProgressionData: (data: { xp: number, level: number, nextXp: number, points: number }) => void;
  
  // UI Actions
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
  activeUpgrades: { 'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0 },

  setScore: (val) => set((state) => {
      // High Score logic remains here as it's a persistent data concern, not gameplay simulation
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
    // We just emit intent. ECS handles the logic.
    // However, for immediate UI feedback, we can optimistically update?
    // No, trust ECS.
    GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option });
  },

  resetProgressionState: () => set({
      score: 0,
      xp: 0,
      level: 1,
      xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
      upgradePoints: 0,
      activeUpgrades: { 'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0 }
  })
});
