import { create } from 'zustand';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useGameStore } from '@/game/store/useGameStore';
import { EnemyTypes } from '@/game/config/Identifiers';

// --- TYPES ---
interface AudioSettings {
  master: boolean;
  music: boolean;
  sfx: boolean;
}

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact';
type BootState = 'standby' | 'active' | 'sandbox';
type SandboxView = 'arena' | 'gallery';

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
  isBreaching: boolean;
  activeModal: ModalType;
  hoveredItem: string | null;
  
  // Sandbox State
  sandboxView: SandboxView;
  galleryTarget: string;
  galleryAction: 'IDLE' | 'ATTACK';
  
  // Audio & Accessibility
  audioSettings: AudioSettings;
  screenShakeStrength: number; // 0.0 to 1.0
  
  // Debug
  isDebugOpen: boolean;
  isDebugMinimized: boolean;
  debugFlags: DebugFlags;
  
  // Actions
  setBootState: (state: BootState) => void;
  setIntroDone: (done: boolean) => void;
  startBreach: () => void;
  
  setSandboxView: (view: SandboxView) => void;
  setGalleryTarget: (target: string) => void;
  toggleGalleryAction: () => void;
  
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setHovered: (item: string | null) => void;
  resetApplication: () => void;
  
  toggleMaster: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  
  // NEW: Shake Control
  setScreenShake: (val: number) => void;
  
  toggleDebugMenu: () => void;
  toggleDebugMinimize: () => void;
  setDebugFlag: (key: keyof DebugFlags, value: any) => void;
  resetDebugFlags: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  bootState: 'standby',
  introDone: false,
  isBreaching: false,
  activeModal: 'none',
  hoveredItem: null,
  
  sandboxView: 'arena',
  galleryTarget: EnemyTypes.DRILLER,
  galleryAction: 'IDLE',
  
  audioSettings: {
    master: true,
    music: false,
    sfx: true,
  },
  
  screenShakeStrength: 1.0, // Default 100%
  
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
  startBreach: () => set({ isBreaching: true }),
  
  setSandboxView: (view) => set({ sandboxView: view }),
  setGalleryTarget: (target) => set({ galleryTarget: target }),
  toggleGalleryAction: () => set(state => ({ galleryAction: state.galleryAction === 'IDLE' ? 'ATTACK' : 'IDLE' })),
  
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
  
  resetApplication: () => {
      useGameStore.getState().stopGame();
      useGameStore.getState().resetGame(); 
      
      set({
          bootState: 'standby',
          introDone: false,
          isBreaching: false,
          activeModal: 'none',
          isDebugOpen: false,
          isDebugMinimized: false,
          sandboxView: 'arena',
          galleryTarget: EnemyTypes.DRILLER,
          galleryAction: 'IDLE'
      });
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
  
  setScreenShake: (val) => set({ screenShakeStrength: val }),
  
  toggleDebugMenu: () => set(state => ({ isDebugOpen: !state.isDebugOpen })),
  toggleDebugMinimize: () => set(state => ({ isDebugMinimized: !state.isDebugMinimized })),
  setDebugFlag: (key, value) => set(state => ({ 
      debugFlags: { ...state.debugFlags, [key]: value } 
  })),
  resetDebugFlags: () => set({
      debugFlags: { godMode: false, panelGodMode: false, peaceMode: false, showHitboxes: false, timeScale: 1.0 }
  })
}));
