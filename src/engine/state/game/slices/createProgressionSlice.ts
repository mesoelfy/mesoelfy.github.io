import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { UpgradePath, RailgunState, SnifferState } from '@/engine/types/game.types';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export interface ProgressionSlice {
  highScore: number;
  upgradePoints: number;
  
  // NEW STRUCTURE
  railgun: RailgunState;
  sniffer: SnifferState;
  
  setScore: (val: number) => void; // Updates high score
  selectUpgrade: (path: UpgradePath) => void;
  resetProgressionState: () => void;
}

const DEFAULT_RAILGUN: RailgunState = { widthLevel: 0, damageLevel: 0, rateLevel: 0 };
const DEFAULT_SNIFFER: SnifferState = { capacityLevel: 0, damageLevel: 0, rateLevel: 0 };

export const createProgressionSlice: StateCreator<GameState, [], [], ProgressionSlice> = (set, get) => ({
  highScore: 0,
  upgradePoints: 0,
  railgun: { ...DEFAULT_RAILGUN },
  sniffer: { ...DEFAULT_SNIFFER },

  setScore: (val) => set((state) => {
      const newHigh = Math.max(state.highScore, val);
      return { highScore: newHigh };
  }),

  selectUpgrade: (path: UpgradePath) => {
    // 1 Point = 1 Notch Logic
    // Validation handled here to ensure we don't overspend or over-level
    const state = get();
    if (state.upgradePoints <= 0) return;

    let success = false;

    // Apply Logic
    if (path === 'RAILGUN_WIDTH' && state.railgun.widthLevel < 10) {
        set(s => ({ railgun: { ...s.railgun, widthLevel: s.railgun.widthLevel + 1 } }));
        success = true;
    } 
    else if (path === 'RAILGUN_DAMAGE' && state.railgun.damageLevel < 3) {
        set(s => ({ railgun: { ...s.railgun, damageLevel: s.railgun.damageLevel + 1 } }));
        success = true;
    }
    else if (path === 'RAILGUN_RATE' && state.railgun.rateLevel < 3) {
        set(s => ({ railgun: { ...s.railgun, rateLevel: s.railgun.rateLevel + 1 } }));
        success = true;
    }
    else if (path === 'SNIFFER_CAPACITY' && state.sniffer.capacityLevel < 4) {
        set(s => ({ sniffer: { ...s.sniffer, capacityLevel: s.sniffer.capacityLevel + 1 } }));
        success = true;
    }
    else if (path === 'SNIFFER_DAMAGE' && state.sniffer.damageLevel < 3) {
        set(s => ({ sniffer: { ...s.sniffer, damageLevel: s.sniffer.damageLevel + 1 } }));
        success = true;
    }
    else if (path === 'SNIFFER_RATE' && state.sniffer.rateLevel < 3) {
        set(s => ({ sniffer: { ...s.sniffer, rateLevel: s.sniffer.rateLevel + 1 } }));
        success = true;
    }
    
    if (success) {
        set(s => ({ upgradePoints: s.upgradePoints - 1 }));
    }

    // Always emit for systems (Audio, VFX, One-offs like PURGE/NOVA)
    GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option: path });
  },

  resetProgressionState: () => set({
      upgradePoints: 0,
      railgun: { ...DEFAULT_RAILGUN },
      sniffer: { ...DEFAULT_SNIFFER }
  })
});
