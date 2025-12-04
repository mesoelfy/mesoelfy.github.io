import { create } from 'zustand';
import { AudioSystem } from '@/core/audio/AudioSystem';

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact';

interface AppState {
  introDone: boolean;
  activeModal: ModalType;
  hoveredItem: string | null;
  musicEnabled: boolean; // Acts as Master Audio Switch
  volume: number;
  setIntroDone: (done: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setHovered: (item: string | null) => void;
  toggleMusic: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  introDone: false,
  activeModal: 'none',
  hoveredItem: null,
  musicEnabled: true, // Default to true, but engine starts suspended
  volume: 0.5,

  setIntroDone: (done) => set({ introDone: done }),
  openModal: (modal) => {
      AudioSystem.playClick(); // Click sound on modal open
      set({ activeModal: modal });
  },
  closeModal: () => {
      AudioSystem.playClick(); // Click sound on modal close
      set({ activeModal: 'none' });
  },
  setHovered: (item) => set({ hoveredItem: item }),
  
  toggleMusic: () => {
      const newState = !get().musicEnabled;
      set({ musicEnabled: newState });
      // In web audio, we don't necessarily "mute" the context, 
      // we just stop triggering playHover/playClick, 
      // but we can also ramp master gain to 0 if we want to kill background music later.
  },
}));
