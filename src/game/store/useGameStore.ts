import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, RegisteredPanel } from '../types/game.types';
import { PLAYER_CONFIG } from '../config/PlayerConfig';

const MAX_PANEL_HEALTH = 1000;

export type UpgradeOption = 'RAPID_FIRE' | 'MULTI_SHOT' | 'SPEED_UP' | 'REPAIR_NANITES';

interface ExtendedGameState extends GameState {
  // Player State
  playerHealth: number;
  maxPlayerHealth: number;
  score: number;
  highScore: number;
  
  // Progression
  xp: number;
  xpToNextLevel: number;
  level: number;
  availableUpgrades: UpgradeOption[];
  
  // System State
  systemIntegrity: number; // 0-100%
  
  // Actions
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  addScore: (amount: number) => void;
  addXp: (amount: number) => void;
  resetGame: () => void;
  recalculateIntegrity: () => void;
}

export const useGameStore = create<ExtendedGameState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      score: 0,
      highScore: 0,
      threatLevel: 1,
      panels: {},
      playerHealth: PLAYER_CONFIG.maxHealth,
      maxPlayerHealth: PLAYER_CONFIG.maxHealth,
      
      xp: 0,
      xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
      level: 1,
      availableUpgrades: [],
      
      systemIntegrity: 100,

      startGame: () => set({ 
        isPlaying: true, 
        score: 0, 
        threatLevel: 1,
        playerHealth: PLAYER_CONFIG.maxHealth,
        xp: 0,
        level: 1,
        xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
        availableUpgrades: []
      }),
      
      stopGame: () => {
        const { score, highScore } = get();
        set({ 
          isPlaying: false,
          highScore: Math.max(score, highScore)
        });
      },

      addScore: (amount) => set((state) => ({ 
        score: state.score + amount 
      })),

      addXp: (amount) => set((state) => {
        let newXp = state.xp + amount;
        let newLevel = state.level;
        let nextReq = state.xpToNextLevel;
        let newUpgrades = [...state.availableUpgrades];

        // Level Up Logic
        if (newXp >= nextReq) {
          newXp -= nextReq;
          newLevel++;
          nextReq = Math.floor(nextReq * PLAYER_CONFIG.xpScalingFactor);
          
          // Generate Choices (Placeholder for UpgradeSystem)
          // In real implementation, we'd pick random distinct ones
          if (newUpgrades.length === 0) { // Only add if not already pending
             newUpgrades = ['RAPID_FIRE', 'MULTI_SHOT']; 
          }
        }

        return {
          xp: newXp,
          level: newLevel,
          xpToNextLevel: nextReq,
          availableUpgrades: newUpgrades
        };
      }),

      damagePlayer: (amount) => set((state) => {
        const newHealth = Math.max(0, state.playerHealth - amount);
        return { playerHealth: newHealth };
      }),

      healPlayer: (amount) => set((state) => ({
        playerHealth: Math.min(state.maxPlayerHealth, state.playerHealth + amount)
      })),

      resetGame: () => set({
        score: 0,
        playerHealth: PLAYER_CONFIG.maxHealth,
        isPlaying: true
      }),

      recalculateIntegrity: () => {
        const { panels } = get();
        const pKeys = Object.keys(panels);
        if (pKeys.length === 0) return;

        let currentSum = 0;
        let maxSum = pKeys.length * MAX_PANEL_HEALTH;

        for (const key of pKeys) {
          currentSum += panels[key].health;
        }

        set({ systemIntegrity: (currentSum / maxSum) * 100 });
      },

      registerPanel: (id, element) => set((state) => ({
        panels: {
          ...state.panels,
          [id]: {
            id,
            element,
            health: MAX_PANEL_HEALTH,
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
        // We trigger recalc in the component or via subscription usually, 
        // but for atomic updates we can do it here or let the loop handle it.
        // For performance, let's assume the loop triggers a recalc periodically 
        // OR we just calculate it derived in UI. 
        // Better yet: Update it here.
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
        if (!panel || panel.isDestroyed || panel.health >= MAX_PANEL_HEALTH) return state;

        const newHealth = Math.min(MAX_PANEL_HEALTH, panel.health + amount);
        return {
          panels: {
            ...state.panels,
            [id]: { ...panel, health: newHealth }
          }
        };
      }),
    }),
    {
      name: 'mesoelfy-os-storage',
      partialize: (state) => ({ highScore: state.highScore }),
    }
  )
);
