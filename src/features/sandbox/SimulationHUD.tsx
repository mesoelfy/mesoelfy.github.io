import { useStore } from '@/core/store/useStore';
import { useGameStore } from '@/game/store/useGameStore';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { Registry } from '@/game/core/ecs/EntityRegistry';
import { EnemyTypes } from '@/game/config/Identifiers';
import { Bug, Clock, Eraser, Crosshair, Box, ScanEye, RotateCw } from 'lucide-react';
import { clsx } from 'clsx';

export const SimulationHUD = () => {
  const { debugFlags, setDebugFlag, sandboxView, setSandboxView } = useStore();
  const { resetGame } = useGameStore();

  const spawnEnemy = (type: string) => {
      GameEventBus.emit(GameEvents.DEBUG_SPAWN, { type, count: 1 });
  };

  const clearBoard = () => {
      Registry.clear();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      
      {/* TOP HEADER */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-md border-b border-elfy-cyan/30 flex items-center justify-between px-6 pointer-events-auto">
        <div className="flex items-center gap-3 text-elfy-cyan">
            <Box size={20} />
            <span className="font-header font-black tracking-widest text-lg">HOLO_DECK // SIMULATION</span>
        </div>
        
        {/* TIME CONTROL */}
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
      </div>

      {/* LEFT: VIEW TOGGLES */}
      <div className="absolute left-6 top-24 flex flex-col gap-2 pointer-events-auto">
         <button 
            onClick={() => setSandboxView('arena')}
            className={clsx(
                "flex items-center gap-3 px-4 py-3 border transition-all font-mono text-xs font-bold w-40",
                sandboxView === 'arena' 
                    ? "bg-elfy-cyan text-black border-elfy-cyan" 
                    : "bg-black/50 text-elfy-cyan border-elfy-cyan/30 hover:bg-elfy-cyan/10"
            )}
         >
            <Crosshair size={16} /> ARENA_MODE
         </button>
         
         <button 
            onClick={() => setSandboxView('gallery')}
            className={clsx(
                "flex items-center gap-3 px-4 py-3 border transition-all font-mono text-xs font-bold w-40",
                sandboxView === 'gallery' 
                    ? "bg-elfy-cyan text-black border-elfy-cyan" 
                    : "bg-black/50 text-elfy-cyan border-elfy-cyan/30 hover:bg-elfy-cyan/10"
            )}
         >
            <ScanEye size={16} /> GALLERY_VIEW
         </button>
      </div>

      {/* RIGHT: SPAWN CONTROLS (Only in Arena) */}
      {sandboxView === 'arena' && (
          <div className="absolute right-6 top-24 w-64 bg-black/80 backdrop-blur-md border border-elfy-cyan/30 p-4 pointer-events-auto flex flex-col gap-4">
             <div>
                <h3 className="text-xs font-mono text-elfy-cyan mb-2 border-b border-elfy-cyan/30 pb-1">ENTITY_INJECTION</h3>
                <div className="grid grid-cols-1 gap-2">
                    {Object.values(EnemyTypes).map(type => (
                        <button 
                            key={type}
                            onClick={() => spawnEnemy(type)} 
                            className="flex items-center justify-between px-3 py-2 border border-elfy-cyan/30 text-xs hover:bg-elfy-cyan hover:text-black transition-colors text-elfy-cyan group"
                        >
                            <span className="uppercase font-bold tracking-wider">{type}</span>
                            <Bug size={14} className="group-hover:rotate-12 transition-transform" />
                        </button>
                    ))}
                </div>
             </div>

             <button 
                onClick={clearBoard}
                className="w-full flex items-center justify-center gap-2 p-2 border border-elfy-red/50 text-elfy-red hover:bg-elfy-red hover:text-black text-xs font-bold transition-colors"
             >
                <Eraser size={14} /> WIPE_ENTITIES
             </button>
          </div>
      )}

      {/* CENTER: GALLERY CONTROLS (Placeholder for now) */}
      {sandboxView === 'gallery' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
              <div className="bg-black/80 border border-elfy-cyan/50 px-6 py-4 flex items-center gap-6 backdrop-blur-md">
                  <div className="text-elfy-cyan text-xs font-mono opacity-70 text-center">
                      GALLERY_MODE // DRAG TO ROTATE
                  </div>
                  <button className="p-2 border border-elfy-cyan text-elfy-cyan hover:bg-elfy-cyan hover:text-black rounded-full">
                      <RotateCw size={20} />
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};
