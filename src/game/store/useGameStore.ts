import { create } from 'zustand';
import { GameState, RegisteredPanel } from '../types/game.types';

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
        health: 100,
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
        [id]: {
          ...panel,
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        }
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
}));
