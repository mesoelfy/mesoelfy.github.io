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

  addScore: (amount: number) => void;
  addXp: (amount: number) => void;
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

  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  
  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),

  selectUpgrade: (option) => {
    GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option });
    // Logic for applying the upgrade to state happens via sync from ECS or direct here?
    // In current arch, ECS handles logic, but UI needs to know points spent.
    // The GameStateSystem in ECS actually manages the 'truth', so we emit the event 
    // and rely on UISyncSystem to update us back.
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
