import { Play, Sparkles, Trash2, Skull, RefreshCw, Crown, Ghost, Shield, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { PanelRegistry } from '@/game/systems/PanelRegistrySystem';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { AudioSystem } from '@/core/audio/AudioSystem';

interface OverridesTabProps {
  closeDebug: () => void;
}

export const OverridesTab = ({ closeDebug }: OverridesTabProps) => {
  const { setIntroDone, setBootState, bootState, resetApplication, debugFlags, setDebugFlag } = useStore();
  const { startGame, stopGame, activateZenMode } = useGameStore();

  const areAllGodModesOn = debugFlags.godMode && debugFlags.panelGodMode && debugFlags.peaceMode;

  const handleSkipBoot = () => {
    setIntroDone(true);
    setBootState('active');
    // Ensure Audio System is ready if skipping boot
    AudioSystem.init();
    AudioSystem.startMusic();
    startGame();
    closeDebug(); 
  };

  const executeCrash = () => {
    // 1. Kill integrity in Store (React UI updates immediately)
    useGameStore.setState({ systemIntegrity: 0 });
    
    // 2. Kill Registry Logic (Visuals/Game Logic updates)
    PanelRegistry.destroyAll();
    
    // 3. Emit Events
    GameEventBus.emit(GameEvents.GAME_OVER, { score: 0 });
    stopGame();
  };

  const handleForceCrash = () => {
    if (bootState === 'standby') {
        // Init Audio/Engine
        setIntroDone(true);
        setBootState('active');
        AudioSystem.init();
        
        // Wait for React to mount the GameOverlay and GameDirector to boot the engine (approx 1 frame)
        setTimeout(() => {
            executeCrash();
        }, 100);
    } else {
        executeCrash();
    }
    closeDebug();
  };

  const handleReboot = () => {
    useGameStore.setState({ playerHealth: 100, playerRebootProgress: 0 });
    const panels = PanelRegistry.getAllPanels();
    panels.forEach(p => PanelRegistry.healPanel(p.id, 1000));
    closeDebug();
  };

  const handleZenModeWrapper = () => {
      if (bootState === 'standby') {
          setIntroDone(true);
          setBootState('active');
          AudioSystem.init();
          AudioSystem.startMusic();
      }
      activateZenMode();
      closeDebug();
  };

  const handleSystemFormat = () => {
      resetApplication();
  };

  const toggleGodSuite = () => {
      const newState = !areAllGodModesOn;
      setDebugFlag('godMode', newState);
      setDebugFlag('panelGodMode', newState);
      setDebugFlag('peaceMode', newState);
  };

  return (
    <div className="space-y-6">
      
      {/* SCENE CONTROL */}
      <div className="space-y-3">
        <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">SCENE_SELECT</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleSkipBoot} className="flex items-center justify-center gap-2 p-3 border border-elfy-green/50 hover:bg-elfy-green hover:text-black transition-all text-xs font-bold">
            <Play size={14} /> SKIP_BOOT
          </button>
          
          <button 
            onClick={handleZenModeWrapper} 
            className="relative flex items-center justify-center gap-2 p-3 overflow-hidden group transition-all duration-300 border border-transparent hover:border-white/50"
          >
            <div className="absolute inset-0 opacity-20 group-hover:opacity-40 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient-xy transition-opacity" />
            <div className="relative z-10 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 font-bold tracking-widest text-xs group-hover:text-white transition-colors">
                <Sparkles size={14} className="text-yellow-300" /> ZEN_MODE
            </div>
          </button>
          <button onClick={handleSystemFormat} className="col-span-2 flex items-center justify-center gap-2 p-3 border border-gray-500/50 text-gray-400 hover:bg-white hover:text-black transition-all text-xs font-bold">
            <Trash2 size={14} /> SYSTEM_FORMAT
          </button>
        </div>
      </div>

      {/* STATE OVERRIDES */}
      <div className="space-y-3">
        <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">STATE_OVERRIDES</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleForceCrash} className="flex items-center justify-center gap-2 p-3 border border-elfy-red/50 text-elfy-red hover:bg-elfy-red hover:text-black transition-all text-xs font-bold">
            <Skull size={14} /> FORCE_CRASH
          </button>
          <button onClick={handleReboot} className="flex items-center justify-center gap-2 p-3 border border-elfy-purple/50 text-elfy-purple hover:bg-elfy-purple hover:text-black transition-all text-xs font-bold">
            <RefreshCw size={14} /> REBOOT_CORE
          </button>
        </div>
      </div>

      {/* CHEATS */}
      <div className="space-y-3">
        <h3 className="text-xs text-elfy-green-dim border-b border-elfy-green-dim/30 pb-1 mb-2">GOD_SUITE</h3>
        
        <button 
          onClick={toggleGodSuite}
          className={clsx(
              "w-full flex items-center justify-center gap-2 p-2 mb-3 text-xs font-bold transition-all border",
              areAllGodModesOn
                  ? "bg-elfy-green text-black border-elfy-green shadow-[0_0_10px_rgba(0,255,65,0.4)]" 
                  : "bg-elfy-green/10 text-elfy-green border-elfy-green/50 hover:bg-elfy-green hover:text-black"
          )}
        >
          <Crown size={14} className={areAllGodModesOn ? "fill-black" : ""} />
          {areAllGodModesOn ? "DISABLE_ALL" : "ENABLE_MAX_POWER"}
        </button>

        <label 
          data-interactive="true"
          className="flex items-center justify-between p-3 border border-elfy-green/30 hover:border-elfy-green hover:bg-elfy-green/20 cursor-pointer transition-all select-none"
        >
          <span className="text-xs font-bold flex items-center gap-2"><Ghost size={14} /> GHOST_MODE (Player Invincible)</span>
          <input 
            type="checkbox" 
            checked={debugFlags.godMode} 
            onChange={(e) => setDebugFlag('godMode', e.target.checked)}
            className="accent-elfy-green cursor-pointer"
          />
        </label>

        <label 
          data-interactive="true"
          className="flex items-center justify-between p-3 border border-elfy-green/30 hover:border-elfy-green hover:bg-elfy-green/20 cursor-pointer transition-all select-none"
        >
          <span className="text-xs font-bold flex items-center gap-2"><Shield size={14} /> FORTRESS_MODE (Panels Invincible)</span>
          <input 
            type="checkbox" 
            checked={debugFlags.panelGodMode} 
            onChange={(e) => setDebugFlag('panelGodMode', e.target.checked)}
            className="accent-elfy-green cursor-pointer"
          />
        </label>

        <label 
          data-interactive="true"
          className="flex items-center justify-between p-3 border border-elfy-green/30 hover:border-elfy-green hover:bg-elfy-green/20 cursor-pointer transition-all select-none"
        >
          <span className="text-xs font-bold flex items-center gap-2"><Crosshair size={14} /> PEACE_PROTOCOL (No Spawns)</span>
          <input 
            type="checkbox" 
            checked={debugFlags.peaceMode} 
            onChange={(e) => setDebugFlag('peaceMode', e.target.checked)}
            className="accent-elfy-green cursor-pointer"
          />
        </label>
      </div>

    </div>
  );
};
