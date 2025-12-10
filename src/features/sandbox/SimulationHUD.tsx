import { useStore } from '@/core/store/useStore';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { AUDIO_CONFIG } from '@/game/config/AudioConfig';
import { Bug, Clock, Crosshair, Box, ScanEye, Play, Speaker, Settings2, Wind, Terminal, Zap, Shield, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useMemo } from 'react';

export const SimulationHUD = () => {
  const { debugFlags, setDebugFlag, sandboxView, setSandboxView } = useStore();
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  
  const playSound = (key: string) => {
      if (key.includes('ambience')) {
          AudioSystem.playAmbience(key);
      } else {
          AudioSystem.playSound(key);
      }
      setLastPlayed(key);
      setTimeout(() => setLastPlayed(null), 200);
  };

  const library = useMemo(() => {
      const allKeys = Object.keys(AUDIO_CONFIG);
      const usedKeys = new Set<string>();

      const defineGroup = (keys: string[]) => {
          keys.forEach(k => usedKeys.add(k));
          return keys.filter(k => allKeys.includes(k));
      };

      // 1. UI & FEEDBACK
      const uiKeys = defineGroup([
          'ui_click', 'ui_hover', 'ui_menu_open', 'ui_menu_close', 
          'ui_optimal', 'ui_error', 'ui_chirp'
      ]);

      // 2. COMBAT & FX
      const combatKeys = defineGroup([
          'fx_player_fire', 'fx_enemy_fire', 'fx_boot_sequence',
          'fx_impact_light', 'fx_impact_heavy', 'fx_player_death',
          'fx_level_up', 'fx_reboot_success', 'fx_teleport'
      ]);

      // 3. LOOPS & AMBIENCE
      const loopKeys = defineGroup([
          'ambience_core', 
          'loop_heal', 'loop_reboot', 'loop_warning', 'loop_drill'
      ]);

      // 4. SYNTHESIS LAB (Protos)
      const synKeys = defineGroup(
          allKeys.filter(k => k.startsWith('syn_'))
      );

      // 5. CATCH ALL
      const unusedKeys = allKeys.filter(k => !usedKeys.has(k));

      return {
          UI: { keys: uiKeys, icon: Terminal, color: 'text-primary-green', border: 'border-primary-green' },
          COMBAT: { keys: combatKeys, icon: Zap, color: 'text-critical-red', border: 'border-critical-red' },
          LOOPS: { keys: loopKeys, icon: Wind, color: 'text-service-cyan', border: 'border-service-cyan' },
          SYNTHS: { keys: synKeys, icon: Box, color: 'text-alert-yellow', border: 'border-alert-yellow' },
          MISC_UNTESTED: { keys: unusedKeys, icon: HelpCircle, color: 'text-gray-400', border: 'border-gray-500' }
      };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-md border-b border-service-cyan/30 flex items-center justify-between px-6 pointer-events-auto">
        <div className="flex items-center gap-3 text-service-cyan">
            <Box size={20} />
            <span className="font-header font-black tracking-widest text-lg">HOLO_DECK // SIMULATION</span>
        </div>
        {sandboxView === 'arena' && (
            <div className="flex items-center gap-4 bg-service-cyan/5 px-4 py-1 rounded border border-service-cyan/20">
                <Clock size={16} className="text-service-cyan" />
                <input 
                    type="range" 
                    min="0.0" max="2.0" step="0.1"
                    value={debugFlags.timeScale}
                    onChange={(e) => setDebugFlag('timeScale', parseFloat(e.target.value))}
                    className="w-32 accent-service-cyan h-1.5 bg-gray-800 rounded-lg cursor-pointer"
                />
                <span className="w-12 text-right font-mono font-bold text-service-cyan text-xs">{debugFlags.timeScale.toFixed(1)}x</span>
            </div>
        )}
      </div>

      {/* LEFT SIDEBAR (NAVIGATION) */}
      <div className="absolute left-6 top-24 flex flex-col gap-2 pointer-events-auto w-40">
         <button 
            onClick={() => setSandboxView('audio')}
            className={clsx("flex items-center gap-3 px-4 py-3 border transition-all font-mono text-xs font-bold", sandboxView === 'audio' ? "bg-service-cyan text-black border-service-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]" : "bg-black/50 text-service-cyan border-service-cyan/30 hover:bg-service-cyan/10")}
         >
            <Speaker size={16} /> SOUND_TEST
         </button>
         <button 
            onClick={() => setSandboxView('arena')}
            className={clsx("flex items-center gap-3 px-4 py-3 border transition-all font-mono text-xs font-bold", sandboxView === 'arena' ? "bg-service-cyan text-black border-service-cyan" : "bg-black/50 text-service-cyan border-service-cyan/30 hover:bg-service-cyan/10")}
         >
            <Crosshair size={16} /> ARENA_MODE
         </button>
         <button 
            onClick={() => setSandboxView('gallery')}
            className={clsx("flex items-center gap-3 px-4 py-3 border transition-all font-mono text-xs font-bold", sandboxView === 'gallery' ? "bg-service-cyan text-black border-service-cyan" : "bg-black/50 text-service-cyan border-service-cyan/30 hover:bg-service-cyan/10")}
         >
            <ScanEye size={16} /> GALLERY_VIEW
         </button>
      </div>

      {/* AUDIO WORKBENCH */}
      {sandboxView === 'audio' && (
          <div className="absolute left-52 top-24 bottom-6 right-6 flex gap-6 pointer-events-auto">
              
              {/* CENTER: WORKBENCH */}
              <div className="flex-1 bg-black/80 backdrop-blur-md border border-white/20 p-6 flex flex-col gap-6 overflow-y-auto">
                  <div className="flex items-center gap-2 border-b border-white/20 pb-2 mb-2">
                      <Settings2 className="text-white" size={20} />
                      <h3 className="font-header font-black text-xl text-white tracking-widest">AUDIO_MATRIX</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <h4 className="text-xs font-bold text-primary-green border-b border-primary-green/30 pb-1">UI_FEEDBACK</h4>
                          <div className="grid grid-cols-2 gap-2">
                              {library.UI.keys.map(key => (
                                  <button key={key} onClick={() => playSound(key)} className="px-3 py-2 border border-primary-green/30 hover:bg-primary-green/10 text-[10px] text-primary-green text-left transition-colors truncate">
                                      {key}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <h4 className="text-xs font-bold text-critical-red border-b border-critical-red/30 pb-1">COMBAT_FX</h4>
                          <div className="grid grid-cols-2 gap-2">
                              {library.COMBAT.keys.map(key => (
                                  <button key={key} onClick={() => playSound(key)} className="px-3 py-2 border border-critical-red/30 hover:bg-critical-red/10 text-[10px] text-critical-red text-left transition-colors truncate">
                                      {key}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-4 p-4 border border-service-cyan/30 bg-service-cyan/5">
                      <h4 className="text-xs font-bold text-service-cyan mb-2 flex items-center gap-2">
                          <Wind size={14} /> AMBIENCE_LOOPS
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                          {library.LOOPS.keys.map(key => (
                              <button key={key} onClick={() => playSound(key)} className="flex flex-col items-center justify-center p-3 border border-service-cyan/30 hover:bg-service-cyan/10 transition-colors">
                                  <span className="text-[10px] text-service-cyan font-bold">{key}</span>
                              </button>
                          ))}
                      </div>
                  </div>

              </div>

              {/* RIGHT: FULL LIBRARY (Categorized) */}
              <div className="w-72 bg-black/90 backdrop-blur-md border border-gray-800 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-gray-800 bg-gray-900/50">
                      <span className="font-mono font-bold text-xs text-gray-400 tracking-widest">ASSET_BROWSER</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black">
                      {Object.entries(library).map(([name, group]) => (
                          <div key={name} className={group.keys.length === 0 ? 'hidden' : ''}>
                              <div className={clsx("flex items-center gap-2 text-[9px] font-bold mb-2 pb-1 border-b uppercase tracking-wider opacity-80", group.color, group.border)}>
                                  <group.icon size={10} />
                                  {name}
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                  {group.keys.map(key => {
                                      const isPlaying = lastPlayed === key;
                                      return (
                                          <button 
                                              key={key} 
                                              onClick={() => playSound(key)}
                                              className={clsx(
                                                  "flex items-center justify-between px-2 py-1.5 border text-[9px] font-mono transition-all",
                                                  isPlaying 
                                                      ? `${group.border} bg-white text-black` 
                                                      : `border-transparent hover:border-white/10 bg-white/5 text-gray-400 hover:text-white`
                                              )}
                                          >
                                              <span className="truncate w-full text-left">{key}</span>
                                              <Play size={8} className={isPlaying ? "fill-black" : "opacity-0 group-hover:opacity-100"} />
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
