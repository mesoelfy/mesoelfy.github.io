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
  
  // Internal Helpers to sync with store if needed, mostly for dev tools
  setActiveUpgrades: (deprecated: any) => void; 
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

  // Deprecated support for old save data re-hydration if necessary, or just no-op
  setActiveUpgrades: () => {},

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
    
    // One-offs (Do not consume points automatically here, logic handled in Systems, but we emit event)
    // Actually, Purge/Restore usually cost nothing or are special interactions.
    // If they cost points, we handle it here. Assuming Purge/Restore are free/cooldown based for now?
    // User instruction: "restore... behave like presently does" (Currently no point cost, just click).
    // "bomb purge button... activating zen mode" (Zen mode is special).
    
    if (success) {
        set(s => ({ upgradePoints: s.upgradePoints - 1 }));
    }

    // Always emit for systems (Audio, VFX, One-offs)
    GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option: path });
  },

  resetProgressionState: () => set({
      upgradePoints: 0,
      railgun: { ...DEFAULT_RAILGUN },
      sniffer: { ...DEFAULT_SNIFFER }
  })
});
