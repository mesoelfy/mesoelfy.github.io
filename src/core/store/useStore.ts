import { create } from 'zustand';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useGameStore } from '@/game/store/useGameStore';

// --- TYPES ---
interface AudioSettings {
  master: boolean;
  music: boolean;
  sfx: boolean;
}

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact';
type BootState = 'standby' | 'active' | 'sandbox';
type SandboxView = 'arena' | 'gallery'; // NEW

interface DebugFlags {
  godMode: boolean;
  panelGodMode: boolean;
  peaceMode: boolean;
  showHitboxes: boolean;
  timeScale: number;
}

interface AppState {
  // App Flow
  bootState: BootState;
  introDone: boolean;
  activeModal: ModalType;
  hoveredItem: string | null;
  
  // Sandbox State
  sandboxView: SandboxView;
  
  // Audio
  audioSettings: AudioSettings;
  
  // Debug
  isDebugOpen: boolean;
  isDebugMinimized: boolean;
  debugFlags: DebugFlags;
  
  // Actions
  setBootState: (state: BootState) => void;
  setIntroDone: (done: boolean) => void;
  setSandboxView: (view: SandboxView) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setHovered: (item: string | null) => void;
  resetApplication: () => void; // NEW
  
  toggleMaster: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  
  // Debug Actions
  toggleDebugMenu: () => void;
  toggleDebugMinimize: () => void;
  setDebugFlag: (key: keyof DebugFlags, value: any) => void;
  resetDebugFlags: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  bootState: 'standby',
  introDone: false,
  activeModal: 'none',
  hoveredItem: null,
  sandboxView: 'arena',
  
  audioSettings: {
    master: true,
    music: false,
    sfx: true,
  },
  
  isDebugOpen: false,
  isDebugMinimized: false,
  debugFlags: {
    godMode: false,
    panelGodMode: false,
    peaceMode: false,
    showHitboxes: false,
    timeScale: 1.0,
  },

  setBootState: (bs) => set({ bootState: bs }),
  setIntroDone: (done) => set({ introDone: done }),
  setSandboxView: (view) => set({ sandboxView: view }),
  
  openModal: (modal) => {
      if (get().audioSettings.master && get().audioSettings.sfx) {
          AudioSystem.playClick(); 
      }
      set({ activeModal: modal });
  },
  
  closeModal: () => {
      if (get().audioSettings.master && get().audioSettings.sfx) {
          AudioSystem.playClick();
      }
      set({ activeModal: 'none' });
  },
  
  setHovered: (item) => set({ hoveredItem: item }),
  
  // Full Reset Logic
  resetApplication: () => {
      // 1. Reset Game Store Logic
      useGameStore.getState().stopGame();
      useGameStore.getState().resetGame(); 
      
      // 2. Reset App State
      set({
          bootState: 'standby',
          introDone: false,
          activeModal: 'none',
          isDebugOpen: false,
          isDebugMinimized: false,
          sandboxView: 'arena'
      });
      
      // 3. Reset Audio if needed (optional)
  },
  
  toggleMaster: () => {
      const prev = get().audioSettings.master;
      const next = !prev;
      set(state => ({ audioSettings: { ...state.audioSettings, master: next } }));
      AudioSystem.setMasterMute(!next);
      if (next && get().audioSettings.sfx) AudioSystem.playClick(); 
  },

  toggleMusic: () => {
      const prev = get().audioSettings.music;
      const next = !prev;
      set(state => ({ audioSettings: { ...state.audioSettings, music: next } }));
      AudioSystem.setMusicMute(!next);
      if (next && get().audioSettings.master && get().audioSettings.sfx) AudioSystem.playClick();
  },

  toggleSfx: () => {
      const prev = get().audioSettings.sfx;
      const next = !prev;
      set(state => ({ audioSettings: { ...state.audioSettings, sfx: next } }));
      AudioSystem.setSfxMute(!next);
      if (next && get().audioSettings.master) AudioSystem.playClick();
  },
  
  toggleDebugMenu: () => set(state => ({ isDebugOpen: !state.isDebugOpen })),
  toggleDebugMinimize: () => set(state => ({ isDebugMinimized: !state.isDebugMinimized })),
  setDebugFlag: (key, value) => set(state => ({ 
      debugFlags: { ...state.debugFlags, [key]: value } 
  })),
  resetDebugFlags: () => set({
      debugFlags: { godMode: false, panelGodMode: false, peaceMode: false, showHitboxes: false, timeScale: 1.0 }
  })
}));
