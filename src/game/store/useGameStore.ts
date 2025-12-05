import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from '../types/game.types';
import { PLAYER_CONFIG } from '../config/PlayerConfig';

const MAX_PANEL_HEALTH = 1000;

export type UpgradeOption = 'RAPID_FIRE' | 'MULTI_SHOT' | 'SPEED_UP' | 'REPAIR_NANITES';

interface ExtendedGameState extends GameState {
  playerHealth: number;
  maxPlayerHealth: number;
  playerRebootProgress: number;
  
  // SCORING
  score: number; // Current Session Kills
  highScore: number; // Best Session Kills
  
  // PROGRESSION
  xp: number;
  xpToNextLevel: number;
  level: number;
  upgradePoints: number;
  activeUpgrades: Record<UpgradeOption, number>;
  
  systemIntegrity: number;
  
  // ACTIONS
  startGame: () => void;
  stopGame: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  tickPlayerReboot: (amount: number) => void;
  damageRebootProgress: (amount: number) => void;
  healPanel: (id: string, amount: number) => void;
  decayReboot: (id: string, amount: number) => void;
  
  incrementKills: (amount: number) => void;
  addXp: (amount: number) => void;
  selectUpgrade: (option: UpgradeOption) => void;
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
      playerRebootProgress: 0,
      
      xp: 0,
      xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
      level: 1,
      upgradePoints: 0,
      activeUpgrades: {
        'RAPID_FIRE': 0,
        'MULTI_SHOT': 0,
        'SPEED_UP': 0,
        'REPAIR_NANITES': 0
      },
      
      systemIntegrity: 100,

      startGame: () => {
        if (get().isPlaying) return;
        set({ 
            isPlaying: true, 
            score: 0, 
            threatLevel: 1,
            playerHealth: PLAYER_CONFIG.maxHealth,
            playerRebootProgress: 0,
            xp: 0,
            level: 1,
            activeUpgrades: {
                'RAPID_FIRE': 0,
                'MULTI_SHOT': 0,
                'SPEED_UP': 0,
                'REPAIR_NANITES': 0
            },
            panels: Object.fromEntries(
                Object.entries(get().panels).map(([k, v]) => [k, { ...v, health: MAX_PANEL_HEALTH, isDestroyed: false }])
            )
        });
      },
      
      stopGame: () => {
        const { score, highScore } = get();
        set({ 
          isPlaying: false,
          highScore: Math.max(score, highScore)
        });
      },

      incrementKills: (amount) => set((state) => {
        const newScore = state.score + amount;
        return { 
            score: newScore,
            highScore: Math.max(newScore, state.highScore)
        };
      }),

      addXp: (amount) => set((state) => {
        let newXp = state.xp + amount;
        let newLevel = state.level;
        let nextReq = state.xpToNextLevel;
        let newPoints = state.upgradePoints;

        while (newXp >= nextReq) {
          newXp -= nextReq;
          newLevel++;
          newPoints++; 
          nextReq = Math.floor(nextReq * PLAYER_CONFIG.xpScalingFactor);
        }

        return {
          xp: newXp,
          level: newLevel,
          xpToNextLevel: nextReq,
          upgradePoints: newPoints
        };
      }),

      selectUpgrade: (option) => set((state) => {
        if (state.upgradePoints <= 0) return state;
        const currentLevel = state.activeUpgrades[option] || 0;
        return {
            activeUpgrades: {
                ...state.activeUpgrades,
                [option]: currentLevel + 1
            },
            upgradePoints: state.upgradePoints - 1
        };
      }),

      damagePlayer: (amount) => set((state) => {
        const newHealth = Math.max(0, state.playerHealth - amount);
        return { playerHealth: newHealth };
      }),

      healPlayer: (amount) => set((state) => ({
        playerHealth: Math.min(state.maxPlayerHealth, state.playerHealth + amount)
      })),
      
      tickPlayerReboot: (amount) => set((state) => {
        if (state.playerHealth > 0) return { playerRebootProgress: 0 };
        const newProgress = Math.max(0, Math.min(100, state.playerRebootProgress + amount));
        if (newProgress >= 100) {
            return {
                playerRebootProgress: 0,
                playerHealth: state.maxPlayerHealth / 2
            };
        }
        return { playerRebootProgress: newProgress };
      }),
      
      damageRebootProgress: (amount) => set((state) => {
        if (state.playerHealth > 0) return state;
        return { playerRebootProgress: Math.max(0, state.playerRebootProgress - amount) };
      }),

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
          const p = panels[key];
          if (!p.isDestroyed) currentSum += p.health;
        }
        set({ systemIntegrity: (currentSum / maxSum) * 100 });
      },

      registerPanel: (id, element) => set((state) => ({
        panels: { ...state.panels, [id]: { id, element, health: MAX_PANEL_HEALTH, isDestroyed: false } }
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
        return { panels: { ...state.panels, [id]: { ...panel, health: newHealth, isDestroyed: newHealth <= 0 } } };
      }),

      healPanel: (id, amount) => set((state) => {
        const panel = state.panels[id];
        if (!panel) return state;
        if (!panel.isDestroyed && panel.health >= MAX_PANEL_HEALTH) return state;
        let newHealth = Math.min(MAX_PANEL_HEALTH, panel.health + amount);
        let wasDestroyed = panel.isDestroyed;
        if (wasDestroyed && newHealth >= MAX_PANEL_HEALTH) {
            wasDestroyed = false;
            newHealth = 500;
        }
        return { panels: { ...state.panels, [id]: { ...panel, health: newHealth, isDestroyed: wasDestroyed } } };
      }),

      decayReboot: (id, amount) => set((state) => {
        const panel = state.panels[id];
        if (!panel || !panel.isDestroyed) return state;
        if (panel.health <= 0) return state;
        const newProgress = Math.max(0, panel.health - amount);
        return { panels: { ...state.panels, [id]: { ...panel, health: newProgress } } };
      }),
    }),
    {
      name: 'mesoelfy-os-storage', // REVERTED
      partialize: (state) => ({ highScore: state.highScore }),
    }
  )
);
