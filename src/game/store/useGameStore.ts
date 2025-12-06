import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UpgradeOption } from '../types/game.types'; // Assuming types exist or inferred

// UI-Centric State
interface GameStateUI {
  isPlaying: boolean;
  
  // Synced Data
  playerHealth: number;
  maxPlayerHealth: number;
  playerRebootProgress: number;
  score: number;
  highScore: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  upgradePoints: number;
  systemIntegrity: number;
  
  activeUpgrades: Record<UpgradeOption, number>;
  panels: Record<string, { id: string, health: number, isDestroyed: boolean, element?: HTMLElement }>;
  
  // Actions
  startGame: () => void;
  stopGame: () => void;
  
  // UI Registration
  registerPanel: (id: string, element: HTMLElement) => void;
  unregisterPanel: (id: string) => void;
  
  // SYNC ACTIONS (Called by UISyncSystem)
  syncGameState: (data: Partial<GameStateUI>) => void;
  syncPanels: (panelsData: Record<string, any>) => void;
  
  // Upgrades (Still UI driven for now)
  selectUpgrade: (option: UpgradeOption) => void;
}

export const useGameStore = create<GameStateUI>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      
      playerHealth: 100,
      maxPlayerHealth: 100,
      playerRebootProgress: 0,
      score: 0,
      highScore: 0,
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      upgradePoints: 0,
      systemIntegrity: 100,
      
      activeUpgrades: { 'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0 },
      panels: {},

      startGame: () => set({ isPlaying: true }),
      
      stopGame: () => {
          const { score, highScore } = get();
          set({ 
              isPlaying: false,
              highScore: Math.max(score, highScore)
          });
      },

      // --- SYNC INTERFACE ---
      syncGameState: (data) => set((state) => ({ ...state, ...data })),
      
      syncPanels: (incomingPanels) => set((state) => {
          // Merge incoming health/status with existing refs
          const merged = { ...state.panels };
          for (const key in incomingPanels) {
              if (merged[key]) {
                  merged[key].health = incomingPanels[key].health;
                  merged[key].isDestroyed = incomingPanels[key].isDestroyed;
              } else {
                  // If sync system sends a panel we don't have (rare), add it
                  merged[key] = incomingPanels[key];
              }
          }
          return { panels: merged };
      }),

      // --- UI REGISTRATION ---
      registerPanel: (id, element) => set((state) => ({
          panels: { 
              ...state.panels, 
              [id]: { 
                  id, 
                  element, 
                  health: 1000, 
                  isDestroyed: false 
              } 
          }
      })),
      
      unregisterPanel: (id) => set((state) => {
          const next = { ...state.panels };
          delete next[id];
          return { panels: next };
      }),

      selectUpgrade: (option) => set((state) => {
          // Note: In Phase 3 we should move this logic to GameStateSystem too
          // But since upgrades happen in UI (Modal usually), strictly speaking it's okay here
          // as long as we tell the GameStateSystem about it.
          // For now, let's keep it here, but we need to push it to GameStateSystem somehow?
          // Actually, GameStateSystem holds the truth. 
          // UI should send "Upgrade Event" to EventBus, GameSystem handles it.
          // For this refactor step, we'll leave upgrades loosely coupled.
          return {
              activeUpgrades: {
                  ...state.activeUpgrades,
                  [option]: (state.activeUpgrades[option] || 0) + 1
              },
              upgradePoints: state.upgradePoints - 1
          };
      }),
    }),
    {
      name: 'mesoelfy-os-storage',
      partialize: (state) => ({ highScore: state.highScore }),
    }
  )
);
