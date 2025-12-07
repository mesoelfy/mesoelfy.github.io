import { create } from 'zustand';
import { AudioSystem } from '@/core/audio/AudioSystem';

// --- TYPES ---
interface AudioSettings {
  master: boolean;
  music: boolean;
  sfx: boolean;
}

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact';
type BootState = 'standby' | 'active' | 'sandbox'; // Added 'sandbox'

interface DebugFlags {
  godMode: boolean;
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
  
  // Audio
  audioSettings: AudioSettings;
  
  // Debug
  isDebugOpen: boolean;
  debugFlags: DebugFlags;
  
  // Actions
  setBootState: (state: BootState) => void;
  setIntroDone: (done: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setHovered: (item: string | null) => void;
  
  toggleMaster: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  
  // Debug Actions
  toggleDebugMenu: () => void;
  setDebugFlag: (key: keyof DebugFlags, value: any) => void;
}

export const useStore = create<AppState>((set, get) => ({
  bootState: 'standby',
  introDone: false,
  activeModal: 'none',
  hoveredItem: null,
  
  audioSettings: {
    master: true,
    music: false,
    sfx: true,
  },
  
  isDebugOpen: false,
  debugFlags: {
    godMode: false,
    peaceMode: false,
    showHitboxes: false,
    timeScale: 1.0,
  },

  setBootState: (bs) => set({ bootState: bs }),
  setIntroDone: (done) => set({ introDone: done }),
  
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
  
  // Audio
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
  
  // Debug
  toggleDebugMenu: () => set(state => ({ isDebugOpen: !state.isDebugOpen })),
  setDebugFlag: (key, value) => set(state => ({ 
      debugFlags: { ...state.debugFlags, [key]: value } 
  })),
}));
