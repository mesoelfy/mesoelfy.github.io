import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { UpgradeOption } from '@/engine/types/game.types';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { PanelId } from '@/engine/config/PanelConfig';
import { DamageOptions } from '@/engine/interfaces';
import { GameStream, StreamKey } from '@/engine/state/GameStream';

const MAX_PANEL_HEALTH = 100;

export interface UISlice {
  panels: Record<string, { id: PanelId, health: number, isDestroyed: boolean, element?: HTMLElement }>;
  interactionTarget: PanelId | null;
  availableUpgrades: UpgradeOption[];

  registerPanel: (id: PanelId, element: HTMLElement) => void;
  unregisterPanel: (id: PanelId) => void;
  setInteractionTarget: (id: PanelId | null) => void;
  
  healPanel: (id: PanelId, amount: number, sourceX?: number) => void;
  damagePanel: (id: PanelId, amount: number, options?: DamageOptions) => void;
  decayPanel: (id: PanelId, amount: number) => void;
  restoreAllPanels: () => number;
  destroyAllPanels: () => void;
  resetUIState: () => void;
}

const getStreamKey = (id: PanelId): StreamKey => {
    return `PANEL_HEALTH_${id.toUpperCase()}` as StreamKey;
};

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

const updateIntegrity = (state: GameState, panels: any) => {
    const integrity = calculateIntegrity(panels);
    // Direct Stream Update
    GameStream.set('SYSTEM_INTEGRITY', integrity);
    state.setSystemIntegrity(integrity);
};

export const createUISlice: StateCreator<GameState, [], [], UISlice> = (set, get) => ({
  panels: {},
  interactionTarget: null,
  availableUpgrades: [],

  registerPanel: (id, element) => {
      set((state) => {
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
          updateIntegrity(state as GameState, panels);
          return { panels };
      });
  },
  
  unregisterPanel: (id) => set((state) => {
      const next = { ...state.panels };
      delete next[id];
      updateIntegrity(state as GameState, next);
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

      // Fast Path Update
      GameStream.set(getStreamKey(id), newHealth);

      if (wasDestroyed && newHealth >= MAX_PANEL_HEALTH) {
          newDestroyed = false;
          newHealth = MAX_PANEL_HEALTH * 0.3; 
          GameStream.set(getStreamKey(id), newHealth); // Reset visual to 30%
          GameEventBus.emit(GameEvents.PANEL_RESTORED, { id, x: sourceX });
          GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR RESTORED: ${id}`, source: 'UISlice' });
      } else if (!wasDestroyed) {
          GameEventBus.emit(GameEvents.PANEL_HEALED, { id, amount });
      }

      set(s => {
          const nextPanels = { ...s.panels, [id]: { ...panel, health: newHealth, isDestroyed: newDestroyed } };
          updateIntegrity(s as GameState, nextPanels);
          return { panels: nextPanels };
      });
  },

  damagePanel: (id, amount, options) => {
      const state = get();
      const panel = state.panels[id];
      if (!panel || panel.isDestroyed) return;

      const silent = options?.silent ?? false;
      const source = options?.source;

      let newHealth = Math.max(0, panel.health - amount);
      let newDestroyed = panel.isDestroyed;

      // Fast Path Update
      GameStream.set(getStreamKey(id), newHealth);

      if (newHealth <= 0) {
          newDestroyed = true;
          newHealth = 0;
          if (!silent) {
              GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
              GameEventBus.emit(GameEvents.LOG_DEBUG, { msg: `SECTOR LOST: ${id}`, source: 'UISlice' });
          }
      } else if (!silent) {
          GameEventBus.emit(GameEvents.PANEL_DAMAGED, { 
              id, amount, currentHealth: newHealth, 
              sourceX: source?.x, sourceY: source?.y 
          });
      }

      set(s => {
          const nextPanels = { ...s.panels, [id]: { ...panel, health: newHealth, isDestroyed: newDestroyed } };
          updateIntegrity(s as GameState, nextPanels);
          return { panels: nextPanels };
      });
  },

  decayPanel: (id, amount) => {
      const state = get();
      const panel = state.panels[id];
      if (!panel || !panel.isDestroyed) return;

      const newHealth = Math.max(0, panel.health - amount);
      
      // Fast Path Update
      GameStream.set(getStreamKey(id), newHealth);

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
          const pid = key as PanelId;
          const p = nextPanels[key];
          if (p.isDestroyed) {
              const startHealth = MAX_PANEL_HEALTH * 0.3;
              nextPanels[key] = { ...p, isDestroyed: false, health: startHealth };
              GameStream.set(getStreamKey(pid), startHealth);
              GameEventBus.emit(GameEvents.PANEL_RESTORED, { id: pid });
              restoredCount++;
          } else if (p.health < MAX_PANEL_HEALTH) {
              nextPanels[key] = { ...p, health: MAX_PANEL_HEALTH };
              GameStream.set(getStreamKey(pid), MAX_PANEL_HEALTH);
          }
      }

      set(s => {
          updateIntegrity(s as GameState, nextPanels);
          return { panels: nextPanels };
      });
      return restoredCount;
  },

  destroyAllPanels: () => {
      const state = get();
      const nextPanels = { ...state.panels };
      for (const key in nextPanels) {
          const pid = key as PanelId;
          const p = nextPanels[key];
          nextPanels[key] = { ...p, health: 0, isDestroyed: true };
          GameStream.set(getStreamKey(pid), 0);
          GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id: pid });
      }
      set(s => {
          updateIntegrity(s as GameState, nextPanels);
          return { panels: nextPanels };
      });
  },

  resetUIState: () => {
      const { panels } = get();
      const resetPanels = Object.fromEntries(
          Object.entries(panels).map(([k, v]) => {
              GameStream.set(getStreamKey(k as PanelId), MAX_PANEL_HEALTH);
              return [k, { ...v, health: MAX_PANEL_HEALTH, isDestroyed: false }];
          })
      );
      set({ panels: resetPanels, interactionTarget: null, availableUpgrades: [] });
      GameStream.set('SYSTEM_INTEGRITY', 100);
      get().setSystemIntegrity(100);
  }
});
