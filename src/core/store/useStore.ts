import { create } from 'zustand';

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact';

interface AppState {
  introDone: boolean;
  activeModal: ModalType;
  hoveredItem: string | null;
  musicEnabled: boolean;
  volume: number;
  setIntroDone: (done: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setHovered: (item: string | null) => void;
  toggleMusic: () => void;
}

export const useStore = create<AppState>((set) => ({
  introDone: false,
  activeModal: 'none',
  hoveredItem: null,
  musicEnabled: false,
  volume: 0.5,

  setIntroDone: (done) => set({ introDone: done }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: 'none' }),
  setHovered: (item) => set({ hoveredItem: item }),
  toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
}));
