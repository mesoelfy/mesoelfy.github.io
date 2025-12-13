import { StateCreator } from 'zustand';
import { GameState } from '../useGameStore';
import { UpgradeOption } from '../../types/game.types';

// SYNCED CONSTANT: 100
const MAX_PANEL_HEALTH = 100;

export interface UISlice {
  panels: Record<string, { id: string, health: number, isDestroyed: boolean, element?: HTMLElement }>;
  interactionTarget: string | null;
  availableUpgrades: UpgradeOption[];

  registerPanel: (id: string, element: HTMLElement) => void;
  unregisterPanel: (id: string) => void;
  
  syncPanels: (panelsData: Record<string, any>) => void;
  healPanel: (id: string, amount: number) => void;
  damagePanel: (id: string, amount: number) => void;
  
  resetUIState: () => void;
}

export const createUISlice: StateCreator<GameState, [], [], UISlice> = (set, get) => ({
  panels: {},
  interactionTarget: null,
  availableUpgrades: [],

  registerPanel: (id, element) => set((state) => ({
      panels: { ...state.panels, [id]: { id, element, health: MAX_PANEL_HEALTH, isDestroyed: false } }
  })),
  
  unregisterPanel: (id) => set((state) => {
      const next = { ...state.panels };
      delete next[id];
      return { panels: next };
  }),

  syncPanels: (incomingPanels) => set((state) => {
      const merged = { ...state.panels };
      for (const key in incomingPanels) {
          const prev = merged[key];
          merged[key] = { ...(prev || {}), ...incomingPanels[key] };
      }
      return { panels: merged };
  }),

  healPanel: () => {}, 
  damagePanel: () => {}, 

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
  }
});
