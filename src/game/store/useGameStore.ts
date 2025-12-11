import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UpgradeOption } from '../types/game.types';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../events/GameEvents';
import { PLAYER_CONFIG } from '../config/PlayerConfig';

const MAX_PANEL_HEALTH = 1000;

interface GameStateUI {
  isPlaying: boolean;
  isZenMode: boolean;
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
  
  interactionTarget: string | null;

  availableUpgrades: UpgradeOption[];
  activeUpgrades: Record<string, number>;
  panels: Record<string, { id: string, health: number, isDestroyed: boolean, element?: HTMLElement }>;
  
  // --- ACTIONS ---
  startGame: () => void;
  stopGame: () => void;
  activateZenMode: () => void;
  
  registerPanel: (id: string, element: HTMLElement) => void;
  unregisterPanel: (id: string) => void;
  syncGameState: (data: Partial<GameStateUI>) => void;
  syncPanels: (panelsData: Record<string, any>) => void;
  selectUpgrade: (option: UpgradeOption) => void;
  addScore: (amount: number) => void;
  addXp: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  tickPlayerReboot: (amount: number) => void;
  healPanel: (id: string, amount: number) => void;
  decayReboot: (id: string, amount: number) => void;
  damagePanel: (id: string, amount: number) => void;
  resetGame: () => void;
  recalculateIntegrity: () => void;
}

export const useGameStore = create<GameStateUI>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      isZenMode: false,
      playerHealth: PLAYER_CONFIG.maxHealth,
      maxPlayerHealth: PLAYER_CONFIG.maxHealth,
      playerRebootProgress: 0,
      score: 0,
      highScore: 0,
      xp: 0,
      level: 1,
      xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
      upgradePoints: 0,
      systemIntegrity: 100,
      interactionTarget: null,
      
      availableUpgrades: [],
      activeUpgrades: { 'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0 },
      panels: {},

      // --- GAME ACTIONS ---

      startGame: () => {
        if (get().isPlaying) return;
        set({ 
            isPlaying: true, 
            isZenMode: false,
            score: 0, 
            playerHealth: PLAYER_CONFIG.maxHealth,
            playerRebootProgress: 0,
            xp: 0,
            level: 1,
            xpToNextLevel: PLAYER_CONFIG.baseXpRequirement,
            availableUpgrades: [],
            activeUpgrades: { 'RAPID_FIRE': 0, 'MULTI_SHOT': 0, 'SPEED_UP': 0, 'REPAIR_NANITES': 0 },
            panels: Object.fromEntries(
                Object.entries(get().panels).map(([k, v]) => [k, { ...v, health: MAX_PANEL_HEALTH, isDestroyed: false }])
            )
        });
      },
      
      stopGame: () => {
          const { score, highScore } = get();
          set({ isPlaying: false, highScore: Math.max(score, highScore) });
      },

      activateZenMode: () => {
          set({ isZenMode: true });
          GameEventBus.emit(GameEvents.ZEN_MODE_ENABLED, null);
      },

      syncGameState: (data) => set((state) => ({ ...state, ...data })),
      
      syncPanels: (incomingPanels) => set((state) => {
          const merged = { ...state.panels };
          for (const key in incomingPanels) {
              const prev = merged[key];
              merged[key] = { ...(prev || {}), ...incomingPanels[key] };
          }
          return { panels: merged };
      }),

      registerPanel: (id, element) => set((state) => ({
          panels: { ...state.panels, [id]: { id, element, health: 1000, isDestroyed: false } }
      })),
      
      unregisterPanel: (id) => set((state) => {
          const next = { ...state.panels };
          delete next[id];
          return { panels: next };
      }),

      selectUpgrade: (option) => {
        GameEventBus.emit(GameEvents.UPGRADE_SELECTED, { option });
      },

      addScore: (amount) => set(state => ({ score: state.score + amount })),
      addXp: (amount) => set(state => ({ xp: state.xp + amount })),
      damagePlayer: (amount) => set(state => ({ playerHealth: Math.max(0, state.playerHealth - amount) })),
      healPlayer: (amount) => set(state => ({ playerHealth: Math.min(state.maxPlayerHealth, state.playerHealth + amount) })),
      tickPlayerReboot: (amount) => set(state => ({ playerRebootProgress: Math.min(100, Math.max(0, state.playerRebootProgress + amount)) })),
      healPanel: (id, amount) => {}, 
      decayReboot: (id, amount) => {}, 
      damagePanel: (id, amount) => {}, 
      resetGame: () => {},
      recalculateIntegrity: () => {},
    }),
    {
      name: 'mesoelfy-os-storage-v2',
      partialize: (state) => ({ highScore: state.highScore }),
    }
  )
);
