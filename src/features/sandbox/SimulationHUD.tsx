import { useStore } from '@/core/store/useStore';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { ServiceLocator } from '@/game/core/ServiceLocator';
import { EnemyTypes } from '@/game/config/Identifiers';
import { Bug, Clock, Eraser, Crosshair, Box, ScanEye, RotateCw, Play, Pause } from 'lucide-react';
import { clsx } from 'clsx';

export const SimulationHUD = () => {
  const { debugFlags, setDebugFlag, sandboxView, setSandboxView, galleryTarget, setGalleryTarget, galleryAction, toggleGalleryAction } = useStore();
  
  const spawnEnemy = (type: string) => {
      GameEventBus.emit(GameEvents.DEBUG_SPAWN, { type, count: 1 });
  };

  const clearBoard = () => {
      try {
          const registry = ServiceLocator.getRegistry();
          if (registry) registry.clear();
      } catch (e) { console.warn("Registry not ready"); }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <div className="absolute top-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-md border-b border-elfy-cyan/30 flex items-center justify-between px-6 pointer-events-auto">
        <div className="flex items-center gap-3 text-elfy-cyan">
            <Box size={20} />
            <span className="font-header font-black tracking-widest text-lg">HOLO_DECK // SIMULATION</span>
        </div>
        {sandboxView === 'arena' && (
            <div className="flex items-center gap-4 bg-elfy-cyan/5 px-4 py-1 rounded border border-elfy-cyan/20">
                <Clock size={16} className="text-elfy-cyan" />
                <input 
                    type="range" 
                    min="0.0" max="2.0" step="0.1"
                    value={debugFlags.timeScale}
                    onChange={(e) => setDebugFlag('timeScale', parseFloat(e.target.value))}
                    className="w-32 accent-elfy-cyan h-1.5 bg-gray-800 rounded-lg cursor-pointer"
                />
                <span className="w-12 text-right font-mono font-bold text-elfy-cyan text-xs">{debugFlags.timeScale.toFixed(1)}x</span>
            </div>
        )}
      </div>

      <div className="absolute left-6 top-24 flex flex-col gap-2 pointer-events-auto">
         <button 
            onClick={() => setSandboxView('arena')}
            className={clsx("flex items-center gap-3 px-4 py-3 border transition-all font-mono text-xs font-bold w-40", sandboxView === 'arena' ? "bg-elfy-cyan text-black border-elfy-cyan" : "bg-black/50 text-elfy-cyan border-elfy-cyan/30 hover:bg-elfy-cyan/10")}
         >
            <Crosshair size={16} /> ARENA_MODE
         </button>
         <button 
            onClick={() => setSandboxView('gallery')}
            className={clsx("flex items-center gap-3 px-4 py-3 border transition-all font-mono text-xs font-bold w-40", sandboxView === 'gallery' ? "bg-elfy-cyan text-black border-elfy-cyan" : "bg-black/50 text-elfy-cyan border-elfy-cyan/30 hover:bg-elfy-cyan/10")}
         >
            <ScanEye size={16} /> GALLERY_VIEW
         </button>
      </div>

      {sandboxView === 'arena' && (
          <div className="absolute right-6 top-24 w-64 bg-black/80 backdrop-blur-md border border-elfy-cyan/30 p-4 pointer-events-auto flex flex-col gap-4">
             <div>
                <h3 className="text-xs font-mono text-elfy-cyan mb-2 border-b border-elfy-cyan/30 pb-1">ENTITY_INJECTION</h3>
                <div className="grid grid-cols-1 gap-2">
                    {Object.values(EnemyTypes).map(type => (
                        <button key={type} onClick={() => spawnEnemy(type)} className="flex items-center justify-between px-3 py-2 border border-elfy-cyan/30 text-xs hover:bg-elfy-cyan hover:text-black transition-colors text-elfy-cyan group">
                            <span className="uppercase font-bold tracking-wider">{type}</span>
                            <Bug size={14} className="group-hover:rotate-12 transition-transform" />
                        </button>
                    ))}
                </div>
             </div>
             <button onClick={clearBoard} className="w-full flex items-center justify-center gap-2 p-2 border border-elfy-red/50 text-elfy-red hover:bg-elfy-red hover:text-black text-xs font-bold transition-colors">
                <Eraser size={14} /> WIPE_ENTITIES
             </button>
          </div>
      )}

      {sandboxView === 'gallery' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
              <div className="flex bg-black/80 border border-elfy-cyan/50 backdrop-blur-md">
                  {Object.values(EnemyTypes).map(type => (
                      <button key={type} onClick={() => setGalleryTarget(type)} className={clsx("px-4 py-2 text-xs font-bold uppercase transition-colors", galleryTarget === type ? "bg-elfy-cyan text-black" : "text-elfy-cyan hover:bg-elfy-cyan/10")}>
                          {type}
                      </button>
                  ))}
              </div>
              <div className="bg-black/80 border border-elfy-cyan/50 backdrop-blur-md">
                  <button onClick={toggleGalleryAction} className={clsx("flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors", galleryAction === 'ATTACK' ? "bg-elfy-red text-black" : "text-elfy-cyan hover:bg-elfy-cyan/10")}>
                      {galleryAction === 'ATTACK' ? <Play size={14} /> : <Pause size={14} />}
                      {galleryAction === 'ATTACK' ? "ATTACK_MODE" : "IDLE_MODE"}
                  </button>
              </div>
              <div className="bg-black/80 border border-elfy-cyan/50 px-4 py-2 flex items-center gap-3 backdrop-blur-md text-elfy-cyan">
                  <RotateCw size={16} />
                  <span className="text-[10px] font-mono opacity-70">DRAG TO ROTATE // SCROLL TO ZOOM</span>
              </div>
          </div>
      )}
    </div>
  );
};
