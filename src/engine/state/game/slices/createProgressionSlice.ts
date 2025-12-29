import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { UpgradePath, SpitterState, SnifferState } from '@/engine/types/game.types';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export interface ProgressionSlice {
  highScore: number;
  upgradePoints: number;
  
  spitter: SpitterState; // Renamed
  sniffer: SnifferState;
  
  setScore: (val: number) => void;
  selectUpgrade: (path: UpgradePath) => void;
  resetProgressionState: () => void;
}

const DEFAULT_SPITTER: SpitterState = { girthLevel: 0, damageLevel: 0, rateLevel: 0 };
const DEFAULT_SNIFFER: SnifferState = { capacityLevel: 0, damageLevel: 0, rateLevel: 0 };

export const createProgressionSlice: StateCreator<GameState, [], [], ProgressionSlice> = (set, get) => ({
  highScore: 0,
  upgradePoints: 0,
  spitter: { ...DEFAULT_SPITTER },
  sniffer: { ...DEFAULT_SNIFFER },

  setScore: (val) => set((state) => {
      const newHigh = Math.max(state.highScore, val);
      return { highScore: newHigh };
  }),

  selectUpgrade: (path: UpgradePath) => {
    const state = get();
    
    let cost = 1;
    if (path === 'RESTORE' || path === 'PURGE') {
        cost = 2;
    }

    if (state.upgradePoints < cost) return;

    let success = false;

    // 3. Weapon Upgrade Logic
    if (path === 'SPITTER_GIRTH' && state.spitter.girthLevel < 10) {
        set(s => ({ spitter: { ...s.spitter, girthLevel: s.spitter.girthLevel + 1 } }));
        success = true;
    } 
    else if (path === 'SPITTER_DAMAGE' && state.spitter.damageLevel < 3) {
        set(s => ({ spitter: { ...s.spitter, damageLevel: s.spitter.damageLevel + 1 } }));
        success = true;
    }
    else if (path === 'SPITTER_RATE' && state.spitter.rateLevel < 3) {
        set(s => ({ spitter: { ...s.spitter, rateLevel: s.spitter.rateLevel + 1 } }));
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
    
    if (path === 'RESTORE' || path === 'PURGE') {
        success = true;
    }
    
    if (success) {
        set(s => ({ upgradePoints: s.upgradePoints - cost }));
        GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option: path });
    }
  },

  resetProgressionState: () => set({
      upgradePoints: 0,
      spitter: { ...DEFAULT_SPITTER },
      sniffer: { ...DEFAULT_SNIFFER }
  })
});
