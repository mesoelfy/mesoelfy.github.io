import { create } from 'zustand';
import { AudioSystem } from '@/core/audio/AudioSystem';

interface AudioSettings {
  master: boolean;
  music: boolean;
  sfx: boolean;
}

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact';

interface AppState {
  introDone: boolean;
  activeModal: ModalType;
  hoveredItem: string | null;
  
  // New Audio State
  audioSettings: AudioSettings;
  
  setIntroDone: (done: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setHovered: (item: string | null) => void;
  
  // New Audio Actions
  toggleMaster: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  introDone: false,
  activeModal: 'none',
  hoveredItem: null,
  
  // Default Settings: Master ON, Music OFF (User must enable), SFX ON
  audioSettings: {
    master: true,
    music: false,
    sfx: true,
  },

  setIntroDone: (done) => set({ introDone: done }),
  
  openModal: (modal) => {
      // Check Master & SFX state before playing sound
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
  
  // --- GRANULAR AUDIO ACTIONS ---

  toggleMaster: () => {
      const prev = get().audioSettings.master;
      const next = !prev;
      set(state => ({ audioSettings: { ...state.audioSettings, master: next } }));
      
      AudioSystem.setMasterMute(!next);
      
      // Feedback sound if turning ON
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
}));
