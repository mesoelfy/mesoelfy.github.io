import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { EnemyTypes } from '@/engine/config/Identifiers';

// --- TYPES ---
interface AudioSettings {
  master: boolean;
  music: boolean;
  sfx: boolean;
  ambience: boolean;
  
  volumeMaster: number;
  volumeMusic: number;
  volumeSfx: number;
  volumeAmbience: number;
  
  ambFilter: number;   
  ambSpeed: number;    
  ambWidth: number;    
  ambModSpeed: number; 
  ambModDepth: number; 

  fxReverbMix: number; 
  fxDelayMix: number;  
  fxDelayTime: number; 
  fxDelayFeedback: number; 
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

  fxReverbMix: 0.2,     
  fxDelayMix: 0.1,      
  fxDelayTime: 0.25,    
  fxDelayFeedback: 0.3  
};

type ModalType = 'none' | 'about' | 'gallery' | 'feed' | 'contact' | 'settings';
type BootState = 'standby' | 'active' | 'sandbox' | 'mobile_lockdown';
type SandboxView = 'arena' | 'gallery' | 'audio';
type GraphicsMode = 'HIGH' | 'POTATO';

interface DebugFlags {
  godMode: boolean;
  panelGodMode: boolean;
  peaceMode: boolean;
  showHitboxes: boolean;
  timeScale: number;
}

interface AppState {
  sessionId: number; 
  bootState: BootState;
  introDone: boolean;
  isBreaching: boolean;
  activeModal: ModalType;
  hoveredItem: string | null;
  
  isSimulationPaused: boolean;
  initialClickPos: { x: number, y: number } | null; // NEW: Track init click
  
  sandboxView: SandboxView;
  
  galleryTarget: string;
  galleryAction: 'IDLE' | 'ATTACK' | 'SPAWN' | 'DIE';
  
  audioSettings: AudioSettings;
  graphicsMode: GraphicsMode;
  screenShakeStrength: number; 
  
  isDebugOpen: boolean;
  isDebugMinimized: boolean;
  debugFlags: DebugFlags;
  
  setBootState: (state: BootState) => void;
  setIntroDone: (done: boolean) => void;
  startBreach: () => void;
  
  setSandboxView: (view: SandboxView) => void;
  setGalleryTarget: (target: string) => void;
  setGalleryAction: (action: 'IDLE' | 'ATTACK' | 'SPAWN' | 'DIE') => void;
  
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  toggleSettings: () => void;
  
  setHovered: (item: string | null) => void;
  resetApplication: () => void;
  
  toggleMaster: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  toggleAmbience: () => void;
  setVolume: (channel: keyof AudioSettings, value: number, max?: number) => void;
  resetAudioSettings: () => void;
  
  setGraphicsMode: (mode: GraphicsMode) => void;
  setScreenShake: (val: number) => void;
  
  toggleDebugMenu: () => void;
  toggleDebugMinimize: () => void;
  setDebugFlag: (key: keyof DebugFlags, value: any) => void;
  resetDebugFlags: () => void;
  
  setSimulationPaused: (paused: boolean) => void;
  setInitialClickPos: (pos: { x: number, y: number } | null) => void; // NEW
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessionId: 0,
      bootState: 'standby',
      introDone: false,
      isBreaching: false,
      activeModal: 'none',
      hoveredItem: null,
      
      isSimulationPaused: false,
      initialClickPos: null,
      
      sandboxView: 'audio',
      galleryTarget: EnemyTypes.DRILLER,
      galleryAction: 'IDLE',
      
      audioSettings: { ...DEFAULT_AUDIO },
      graphicsMode: 'HIGH',
      
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

      setBootState: (bs) => set({ 
          bootState: bs,
          isBreaching: bs === 'active' || bs === 'mobile_lockdown' ? false : get().isBreaching 
      }),
      setIntroDone: (done) => set({ introDone: done }),
      startBreach: () => set({ isBreaching: true }),
      
      setSandboxView: (view) => set({ sandboxView: view }),
      setGalleryTarget: (target) => set({ galleryTarget: target }),
      setGalleryAction: (action) => set({ galleryAction: action }),
      
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: 'none' }),

      toggleSettings: () => {
          const current = get().activeModal;
          if (current === 'settings') get().closeModal();
          else get().openModal('settings');
      },
      
      setHovered: (item) => set({ hoveredItem: item }),
      
      resetApplication: () => {
          AudioSystem.stopAll();
          useGameStore.getState().stopGame();
          useGameStore.getState().resetGame(); 
          set(state => ({
              sessionId: state.sessionId + 1,
              bootState: 'standby',
              introDone: false,
              isBreaching: false,
              activeModal: 'none',
              isDebugOpen: false,
              isDebugMinimized: false,
              sandboxView: 'audio',
              galleryTarget: EnemyTypes.DRILLER,
              galleryAction: 'IDLE',
              isSimulationPaused: false,
              initialClickPos: null
          }));
      },
      
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
          const limit = max || 2.0;
          const clamped = Math.max(0, Math.min(limit, value));
          set(s => ({ audioSettings: { ...s.audioSettings, [channel]: clamped } }));
          AudioSystem.updateVolumes();
      },
      
      resetAudioSettings: () => {
          set({ audioSettings: { ...DEFAULT_AUDIO } });
          AudioSystem.updateVolumes();
          AudioSystem.playClick();
      },
      
      setGraphicsMode: (mode) => set({ graphicsMode: mode }),
      setScreenShake: (val) => set({ screenShakeStrength: val }),
      
      toggleDebugMenu: () => set(state => ({ isDebugOpen: !state.isDebugOpen })),
      toggleDebugMinimize: () => set(state => ({ isDebugMinimized: !state.isDebugMinimized })),
      setDebugFlag: (key, value) => set(state => ({ 
          debugFlags: { ...state.debugFlags, [key]: value } 
      })),
      resetDebugFlags: () => set({
          debugFlags: { godMode: false, panelGodMode: false, peaceMode: false, showHitboxes: false, timeScale: 1.0 }
      }),
      
      setSimulationPaused: (paused) => set({ isSimulationPaused: paused }),
      setInitialClickPos: (pos) => set({ initialClickPos: pos })
    }),
    {
      name: 'mesoelfy-ui-settings-v3',
      partialize: (state) => ({ 
          audioSettings: state.audioSettings,
          screenShakeStrength: state.screenShakeStrength,
          graphicsMode: state.graphicsMode,
          introDone: state.introDone
      }), 
    }
  )
);
