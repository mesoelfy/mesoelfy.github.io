import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { useGameStore } from '@/game/store/useGameStore';
import { EnemyTypes } from '@/game/config/Identifiers';

// --- TYPES ---
interface AudioSettings {
  master: boolean;
  music: boolean;
  sfx: boolean;
  ambience: boolean;
  
  // Levels (0.0 - 2.0)
  volumeMaster: number;
  volumeMusic: number;
  volumeSfx: number;
  volumeAmbience: number;
  
  // Ambience Lab (0.0 - 4.0+)
  ambFilter: number;   // Density
  ambSpeed: number;    // Circulation
  ambWidth: number;    // Width
  ambModSpeed: number; // Fluctuation (NEW)
  ambModDepth: number; // Instability (NEW)
}

const DEFAULT_AUDIO: AudioSettings = {
  master: true,
  music: false,
  sfx: true,
  ambience: true,
  volumeMaster: 1.0,
  volumeMusic: 1.0,
  volumeSfx: 1.0,
  volumeAmbience: 1.0,
  ambFilter: 0.5,
  ambSpeed: 0.5,
  ambWidth: 0.5,
  ambModSpeed: 0.5, 
  ambModDepth: 0.5, 
};

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact' | 'settings';
type BootState = 'standby' | 'active' | 'sandbox';
type SandboxView = 'arena' | 'gallery' | 'audio';

interface DebugFlags {
  godMode: boolean;
  panelGodMode: boolean;
  peaceMode: boolean;
  showHitboxes: boolean;
  timeScale: number;
}

interface AppState {
  bootState: BootState;
  introDone: boolean;
  isBreaching: boolean;
  activeModal: ModalType;
  hoveredItem: string | null;
  
  sandboxView: SandboxView;
  galleryTarget: string;
  galleryAction: 'IDLE' | 'ATTACK';
  
  audioSettings: AudioSettings;
  screenShakeStrength: number; 
  
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
  toggleSettings: () => void;
  
  setHovered: (item: string | null) => void;
  resetApplication: () => void;
  
  // Audio Controls
  toggleMaster: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  toggleAmbience: () => void;
  setVolume: (channel: keyof AudioSettings, value: number, max?: number) => void;
  resetAudioSettings: () => void;
  
  setScreenShake: (val: number) => void;
  
  toggleDebugMenu: () => void;
  toggleDebugMinimize: () => void;
  setDebugFlag: (key: keyof DebugFlags, value: any) => void;
  resetDebugFlags: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      bootState: 'standby',
      introDone: false,
      isBreaching: false,
      activeModal: 'none',
      hoveredItem: null,
      
      sandboxView: 'audio',
      galleryTarget: EnemyTypes.DRILLER,
      galleryAction: 'IDLE',
      
      audioSettings: { ...DEFAULT_AUDIO },
      
      screenShakeStrength: 1.0, 
      
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
          if (get().audioSettings.master && get().audioSettings.sfx) AudioSystem.playClick(); 
          set({ activeModal: modal });
      },
      
      closeModal: () => {
          if (get().audioSettings.master && get().audioSettings.sfx) AudioSystem.playClick();
          set({ activeModal: 'none' });
      },

      toggleSettings: () => {
          const current = get().activeModal;
          if (current === 'settings') get().closeModal();
          else get().openModal('settings');
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
              sandboxView: 'audio',
              galleryTarget: EnemyTypes.DRILLER,
              galleryAction: 'IDLE'
          });
      },
      
      // --- AUDIO ACTIONS ---
      toggleMaster: () => {
          set(s => ({ audioSettings: { ...s.audioSettings, master: !s.audioSettings.master } }));
          AudioSystem.updateVolumes();
          if (get().audioSettings.master) AudioSystem.playClick(); 
      },
      toggleMusic: () => {
          set(s => ({ audioSettings: { ...s.audioSettings, music: !s.audioSettings.music } }));
          AudioSystem.updateVolumes();
          if (get().audioSettings.music) AudioSystem.playClick();
      },
      toggleSfx: () => {
          set(s => ({ audioSettings: { ...s.audioSettings, sfx: !s.audioSettings.sfx } }));
          AudioSystem.updateVolumes();
          if (get().audioSettings.sfx) AudioSystem.playClick();
      },
      toggleAmbience: () => {
          set(s => ({ audioSettings: { ...s.audioSettings, ambience: !s.audioSettings.ambience } }));
          AudioSystem.updateVolumes();
          if (get().audioSettings.ambience) AudioSystem.playClick();
      },
      setVolume: (channel, value, max = 2.0) => {
          const clamped = Math.max(0, Math.min(max, value));
          set(s => ({ audioSettings: { ...s.audioSettings, [channel]: clamped } }));
          AudioSystem.updateVolumes();
      },
      resetAudioSettings: () => {
          set({ audioSettings: { ...DEFAULT_AUDIO } });
          AudioSystem.updateVolumes();
          AudioSystem.playClick();
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
    }),
    {
      // CHANGED: v3 forces reset of old bad data
      name: 'mesoelfy-ui-settings-v3', 
      partialize: (state) => ({ 
          audioSettings: state.audioSettings,
          screenShakeStrength: state.screenShakeStrength,
          introDone: state.introDone
      }), 
    }
  )
);
