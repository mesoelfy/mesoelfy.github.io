import { create } from 'zustand';
import { GameState } from '../types/game.types';

const MAX_HEALTH = 1000;

export const useGameStore = create<GameState>((set) => ({
  isPlaying: false,
  score: 0,
  threatLevel: 1,
  panels: {},

  startGame: () => set({ isPlaying: true, score: 0, threatLevel: 1 }),
  stopGame: () => set({ isPlaying: false }),

  registerPanel: (id, element) => set((state) => ({
    panels: {
      ...state.panels,
      [id]: {
        id,
        element,
        health: MAX_HEALTH,
        isDestroyed: false,
      }
    }
  })),

  unregisterPanel: (id) => set((state) => {
    const newPanels = { ...state.panels };
    delete newPanels[id];
    return { panels: newPanels };
  }),

  damagePanel: (id, amount) => set((state) => {
    const panel = state.panels[id];
    if (!panel || panel.isDestroyed) return state;

    const newHealth = Math.max(0, panel.health - amount);
    return {
      panels: {
        ...state.panels,
        [id]: {
          ...panel,
          health: newHealth,
          isDestroyed: newHealth <= 0
        }
      }
    };
  }),

  healPanel: (id, amount) => set((state) => {
    const panel = state.panels[id];
    if (!panel || panel.isDestroyed || panel.health >= MAX_HEALTH) return state;

    const newHealth = Math.min(MAX_HEALTH, panel.health + amount);
    return {
      panels: {
        ...state.panels,
        [id]: { ...panel, health: newHealth }
      }
    };
  }),
}));
