import { useStore } from '@/core/store/useStore';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { EnemyTypes } from '@/game/config/Identifiers';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { AUDIO_CONFIG } from '@/game/config/AudioConfig';
import { Bug, Clock, Eraser, Crosshair, Box, ScanEye, RotateCw, Play, Pause, Speaker, Activity, Waves, Zap, Heart, Database, Settings2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

export const SimulationHUD = () => {
  const { debugFlags, setDebugFlag, sandboxView, setSandboxView, galleryTarget, setGalleryTarget, galleryAction, toggleGalleryAction } = useStore();
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  
  const spawnEnemy = (type: string) => {
      GameEventBus.emit(GameEvents.DEBUG_SPAWN, { type, count: 1 });
  };

  const clearBoard = () => {
      try {
          const registry = ServiceLocator.getRegistry();
          if (registry) registry.clear();
      } catch (e) { console.warn("Registry not ready"); }
  };

  const playSound = (key: string) => {
      AudioSystem.playSound(key);
      setLastPlayed(key);
      setTimeout(() => setLastPlayed(null), 200);
  };

  const library = {
      CORE: { 
          keys: Object.keys(AUDIO_CONFIG).filter(k => !k.includes('proto_') && !k.includes('drill_') && !k.includes('misc_') && (k.includes('laser') || k.includes('click') || k.includes('hover') || k.includes('heal') || k.includes('powerup'))),
          color: 'text-primary-green',
          borderColor: 'border-primary-green',
          icon: Zap
      },
      COMBAT: { 
          keys: ['driller_drill', 'enemy_fire', 'explosion_small', 'explosion_large', 'player_down_glitch', 'warning_heartbeat'],
          color: 'text-critical-red',
          borderColor: 'border-critical-red',
          icon: Bug
      },
      MISC_DRILLS: {
          keys: Object.keys(AUDIO_CONFIG).filter(k => k.includes('drill_') && k !== 'driller_drill'),
          color: 'text-latent-purple',
          borderColor: 'border-latent-purple',
          icon: Database
      },
      MISC: {
          keys: Object.keys(AUDIO_CONFIG).filter(k => k.includes('misc_')),
          color: 'text-alert-yellow',
          borderColor: 'border-alert-yellow',
          icon: Database
      }
  };

  const prototypes = [
      { id: 'CHARGE', label: 'HUNTER_CHARGE', icon: Zap, keys: ['proto_charge_a', 'proto_charge_b', 'proto_charge_c'], color: 'text-service-cyan' },
      { id: 'WAVE', label: 'THREAT_LEVEL', icon: Waves, keys: ['proto_wave_a', 'proto_wave_b', 'proto_wave_c'], color: 'text-critical-red' },
      { id: 'HP', label: 'LOW_HEALTH_TEST', icon: Heart, keys: ['proto_lowhp_a', 'proto_lowhp_b', 'proto_lowhp_c'], color: 'text-alert-yellow' },
  ];

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
                      <h3 className="font-header font-black text-xl text-white tracking-widest">PROTOTYPE_BENCH</h3>
                  </div>
                  
                  {/* SELECTED FINALISTS ROW */}
                  <div className="bg-primary-green/5 border border-primary-green/30 p-4 rounded-sm">
                      <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="text-primary-green" size={18} />
                          <span className="font-mono font-bold tracking-wider text-sm text-primary-green">SELECTED_IMPLEMENTATIONS</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                          {[
                              { label: 'DRILLER (MOD_G)', key: 'driller_drill', sub: 'IMPACT' },
                              { label: 'LOW_INTEGRITY (VAR_F)', key: 'warning_heartbeat', sub: 'SUB-BASS' },
                              { label: 'PLAYER_DEATH (VAR_K)', key: 'player_down_glitch', sub: 'CHOPPER' }
                          ].map(item => {
                              const isPlaying = lastPlayed === item.key;
                              return (
                                  <button 
                                      key={item.key}
                                      onClick={() => playSound(item.key)}
                                      className={clsx(
                                          "flex flex-col items-center justify-center py-6 border transition-all duration-100",
                                          isPlaying 
                                              ? "bg-primary-green text-black border-primary-green shadow-[0_0_20px_#78F654] scale-95" 
                                              : "bg-black border-primary-green/30 hover:border-primary-green hover:bg-primary-green/10 text-primary-green"
                                      )}
                                  >
                                      <span className="text-xs font-black mb-1">{item.label}</span>
                                      <span className="text-[8px] opacity-70 font-mono tracking-tighter">{item.sub}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  {/* PROTOTYPE ROWS */}
                  {prototypes.map(proto => (
                      <div key={proto.id} className="bg-white/5 border border-white/10 p-4 rounded-sm">
                          <div className="flex items-center gap-2 mb-4">
                              <proto.icon className={proto.color} size={18} />
                              <span className={clsx("font-mono font-bold tracking-wider text-sm", proto.color)}>{proto.label}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                              {proto.keys.map((key, idx) => {
                                  const label = idx === 0 ? 'VARIANT_A' : idx === 1 ? 'VARIANT_B' : 'VARIANT_C';
                                  const isPlaying = lastPlayed === key;
                                  return (
                                      <button 
                                          key={key}
                                          onClick={() => playSound(key)}
                                          className={clsx(
                                              "flex flex-col items-center justify-center py-6 border transition-all duration-100",
                                              isPlaying 
                                                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-95" 
                                                  : "bg-black border-white/20 hover:border-white/50 hover:bg-white/5"
                                          )}
                                      >
                                          <span className="text-xs font-bold mb-1">{label}</span>
                                          <span className="text-[9px] opacity-50 font-mono">{AUDIO_CONFIG[key].type.toUpperCase()}</span>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  ))}
              </div>

              {/* RIGHT: LIBRARY (ALL SOUNDS) */}
              <div className="w-80 bg-black/90 backdrop-blur-md border border-service-cyan/30 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-service-cyan/30 bg-service-cyan/5">
                      <span className="font-mono font-bold text-xs text-service-cyan tracking-widest">ACTIVE_LIBRARY</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-service-cyan scrollbar-track-black">
                      {Object.entries(library).map(([name, group]) => (
                          <div key={name}>
                              <div className={clsx("flex items-center gap-2 text-[10px] font-bold mb-2 pb-1 border-b uppercase tracking-wider", group.color, group.borderColor)}>
                                  <group.icon size={12} />
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
                                                  "flex items-center justify-between px-2 py-1.5 border text-[10px] font-mono transition-all",
                                                  isPlaying 
                                                      ? `${group.borderColor} bg-white text-black` 
                                                      : `border-transparent hover:border-white/30 bg-white/5 text-gray-300 hover:bg-white/10`
                                              )}
                                          >
                                              <span>{key}</span>
                                              <Play size={10} className={isPlaying ? "fill-black" : ""} />
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

      {/* ... ARENA/GALLERY (UNCHANGED) ... */}
    </div>
  );
};
