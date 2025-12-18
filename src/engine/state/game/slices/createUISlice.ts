import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { UpgradeOption } from '@/engine/types/game.types';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

const MAX_PANEL_HEALTH = 100;

export interface UISlice {
  panels: Record<string, { id: string, health: number, isDestroyed: boolean, element?: HTMLElement }>;
  interactionTarget: string | null;
  availableUpgrades: UpgradeOption[];

  // Core Registry
  registerPanel: (id: string, element: HTMLElement) => void;
  unregisterPanel: (id: string) => void;
  
  // Interaction
  setInteractionTarget: (id: string | null) => void;
  
  // Logic (Moved from StructureHealthService)
  healPanel: (id: string, amount: number, sourceX?: number) => void;
  damagePanel: (id: string, amount: number, silent?: boolean, sourceX?: number, sourceY?: number) => void;
  decayPanel: (id: string, amount: number) => void;
  restoreAllPanels: () => number;
  destroyAllPanels: () => void;
  
  resetUIState: () => void;
}

// Helper to calculate global integrity
const calculateIntegrity = (panels: Record<string, { health: number, isDestroyed: boolean }>) => {
    let current = 0;
    let max = 0;
    const values = Object.values(panels);
    if (values.length === 0) return 100;

    for (const p of values) {
        max += MAX_PANEL_HEALTH;
        if (!p.isDestroyed) current += p.health;
    }
    return max > 0 ? (current / max) * 100 : 100;
};

export const createUISlice: StateCreator<GameState, [], [], UISlice> = (set, get) => ({
  panels: {},
  interactionTarget: null,
  availableUpgrades: [],

  registerPanel: (id, element) => {
      set((state) => {
          // Preserve existing state if re-registering (React HMR safety)
          const existing = state.panels[id];
          const panels = { 
              ...state.panels, 
              [id]: { 
                  id, 
                  element, 
                  health: existing ? existing.health : MAX_PANEL_HEALTH, 
                  isDestroyed: existing ? existing.isDestroyed : false 
              } 
          };
          // Recalculate integrity immediately on registration
          const integrity = calculateIntegrity(panels);
          state.setSystemIntegrity(integrity);
          return { panels };
      });
  },
  
  unregisterPanel: (id) => set((state) => {
      const next = { ...state.panels };
      delete next[id];
      // Recalc integrity
      const integrity = calculateIntegrity(next);
      state.setSystemIntegrity(integrity);
      return { panels: next };
  }),

  setInteractionTarget: (id) => set({ interactionTarget: id }),

  healPanel: (id, amount, sourceX) => {
      const state = get();
      const panel = state.panels[id];
      if (!panel) return;

      const wasDestroyed = panel.isDestroyed;
      let newHealth = panel.health;
      let newDestroyed = panel.isDestroyed;

      newHealth = Math.min(MAX_PANEL_HEALTH, newHealth + amount);

      if (wasDestroyed && newHealth >= MAX_PANEL_HEALTH) {
          newDestroyed = false;
          newHealth = MAX_PANEL_HEALTH * 0.3; // Reboot penalty start
          GameEventBus.emit(GameEvents.PANEL_RESTORED, { id, x: sourceX });
          GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR RESTORED: ${id}`, source: 'UISlice' });
      } else if (!wasDestroyed) {
          GameEventBus.emit(GameEvents.PANEL_HEALED, { id, amount });
      }

      set(s => {
          const nextPanels = { ...s.panels, [id]: { ...panel, health: newHealth, isDestroyed: newDestroyed } };
          const integrity = calculateIntegrity(nextPanels);
          s.setSystemIntegrity(integrity);
          return { panels: nextPanels };
      });
  },

  damagePanel: (id, amount, silent = false, sourceX, sourceY) => {
      const state = get();
      // Skip damage if God Mode
      // Note: We access global store for debug flags, or pass it in. 
      // For simplicity, we assume caller checks flags or we check directly if possible.
      // Ideally, the System calling this checks flags.
      
      const panel = state.panels[id];
      if (!panel || panel.isDestroyed) return;

      let newHealth = Math.max(0, panel.health - amount);
      let newDestroyed = panel.isDestroyed;

      if (newHealth <= 0) {
          newDestroyed = true;
          newHealth = 0;
          if (!silent) {
              GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
              GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR LOST: ${id}`, source: 'UISlice' });
          }
      } else if (!silent) {
          GameEventBus.emit(GameEvents.PANEL_DAMAGED, { 
              id, amount, currentHealth: newHealth, sourceX, sourceY 
          });
      }

      set(s => {
          const nextPanels = { ...s.panels, [id]: { ...panel, health: newHealth, isDestroyed: newDestroyed } };
          const integrity = calculateIntegrity(nextPanels);
          s.setSystemIntegrity(integrity);
          return { panels: nextPanels };
      });
  },

  decayPanel: (id, amount) => {
      const state = get();
      const panel = state.panels[id];
      if (!panel || !panel.isDestroyed) return;

      const newHealth = Math.max(0, panel.health - amount);
      if (newHealth !== panel.health) {
          set(s => ({
              panels: { ...s.panels, [id]: { ...panel, health: newHealth } }
          }));
      }
  },

  restoreAllPanels: () => {
      const state = get();
      let restoredCount = 0;
      const nextPanels = { ...state.panels };

      for (const key in nextPanels) {
          const p = nextPanels[key];
          if (p.isDestroyed) {
              nextPanels[key] = { ...p, isDestroyed: false, health: MAX_PANEL_HEALTH * 0.3 };
              GameEventBus.emit(GameEvents.PANEL_RESTORED, { id: key });
              restoredCount++;
          } else if (p.health < MAX_PANEL_HEALTH) {
              nextPanels[key] = { ...p, health: MAX_PANEL_HEALTH };
          }
      }

      const integrity = calculateIntegrity(nextPanels);
      set(s => {
          s.setSystemIntegrity(integrity);
          return { panels: nextPanels };
      });
      return restoredCount;
  },

  destroyAllPanels: () => {
      const state = get();
      const nextPanels = { ...state.panels };
      for (const key in nextPanels) {
          const p = nextPanels[key];
          nextPanels[key] = { ...p, health: 0, isDestroyed: true };
          GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id: key });
      }
      set(s => {
          s.setSystemIntegrity(0);
          return { panels: nextPanels };
      });
  },

  resetUIState: () => {
      const { panels } = get();
      const resetPanels = Object.fromEntries(
          Object.entries(panels).map(([k, v]) => [k, { ...v, health: MAX_PANEL_HEALTH, isDestroyed: false }])
      );
      set({ 
          panels: resetPanels,
          interactionTarget: null,
          availableUpgrades: []
      });
      get().setSystemIntegrity(100);
  }
});
