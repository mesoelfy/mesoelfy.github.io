import { create } from 'zustand';
import { GameState, RegisteredPanel } from '../types/game.types';

// CONSTANTS
const MAX_HEALTH = 1000; // Increased from 100

export const useGameStore = create<GameState>((set, get) => ({
  isPlaying: false,
  score: 0,
  threatLevel: 1,
  panels: {},

  startGame: () => set({ isPlaying: true, score: 0, threatLevel: 1 }),
  stopGame: () => set({ isPlaying: false }),

  registerPanel: (id, rect) => set((state) => ({
    panels: {
      ...state.panels,
      [id]: {
        id,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        health: MAX_HEALTH, // Updated
        isDestroyed: false,
      }
    }
  })),

  updatePanelRect: (id, rect) => set((state) => {
    const panel = state.panels[id];
    if (!panel) return state;
    return {
      panels: {
        ...state.panels,
        [id]: { ...panel, x: rect.left, y: rect.top, width: rect.width, height: rect.height }
      }
    };
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

  // NEW: Repair Logic
  healPanel: (id, amount) => set((state) => {
    const panel = state.panels[id];
    // Cannot heal if destroyed or already full
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
