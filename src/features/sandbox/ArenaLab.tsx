import { ServiceLocator } from '@/game/core/ServiceLocator';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { EnemyTypes } from '@/game/config/Identifiers';
import { Bug, Trash2, Shield, PlusCircle, Play } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { clsx } from 'clsx';

export const ArenaLab = () => {
  const { debugFlags, setDebugFlag } = useStore();

  const spawn = (type: string, count: number = 1) => {
      const spawner = ServiceLocator.getSpawner();
      const radius = 10;
      
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          spawner.spawnEnemy(type, x, y);
      }
      AudioSystem.playSound('ui_click');
  };

  const clearEnemies = () => {
      const registry = ServiceLocator.getRegistry();
      const enemies = registry.getByTag('ENEMY');
      enemies.forEach(e => registry.destroyEntity(e.id as number));
      AudioSystem.playSound('ui_error');
  };

  return (
    <div className="flex flex-col gap-6 w-72 pointer-events-auto h-full">
        
        {/* INJECTION PANEL */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-service-cyan text-xs font-bold border-b border-service-cyan/20 pb-2">
                <Bug size={14} /> ENTITY_INJECTION
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => spawn(EnemyTypes.DRILLER, 1)} className="p-2 bg-service-cyan/10 border border-service-cyan/30 text-[10px] text-service-cyan hover:bg-service-cyan hover:text-black transition-colors font-bold">
                    +1 DRILLER
                </button>
                <button onClick={() => spawn(EnemyTypes.DRILLER, 5)} className="p-2 bg-service-cyan/10 border border-service-cyan/30 text-[10px] text-service-cyan hover:bg-service-cyan hover:text-black transition-colors font-bold">
                    +5 SWARM
                </button>
                <button onClick={() => spawn(EnemyTypes.KAMIKAZE, 1)} className="p-2 bg-service-cyan/10 border border-service-cyan/30 text-[10px] text-service-cyan hover:bg-service-cyan hover:text-black transition-colors font-bold">
                    +1 KAMIKAZE
                </button>
                <button onClick={() => spawn(EnemyTypes.HUNTER, 1)} className="p-2 bg-service-cyan/10 border border-service-cyan/30 text-[10px] text-service-cyan hover:bg-service-cyan hover:text-black transition-colors font-bold">
                    +1 HUNTER
                </button>
                <button onClick={() => spawn(EnemyTypes.DAEMON, 1)} className="col-span-2 p-2 bg-latent-purple/10 border border-latent-purple/30 text-[10px] text-latent-purple hover:bg-latent-purple hover:text-black transition-colors font-bold">
                    +1 DAEMON (ALLY)
                </button>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-service-cyan text-xs font-bold border-b border-service-cyan/20 pb-2">
                <Shield size={14} /> ARENA_RULES
            </div>
            
            <button 
                onClick={() => setDebugFlag('godMode', !debugFlags.godMode)}
                className={clsx(
                    "w-full flex items-center justify-between p-3 border text-xs font-bold transition-all",
                    debugFlags.godMode 
                        ? "bg-service-cyan text-black border-service-cyan" 
                        : "bg-black border-service-cyan/30 text-service-cyan"
                )}
            >
                <span>PLAYER_INVULNERABLE</span>
                {debugFlags.godMode && <Shield size={12} />}
            </button>

            <button 
                onClick={clearEnemies}
                className="w-full flex items-center justify-center gap-2 p-3 border border-critical-red/50 text-critical-red hover:bg-critical-red hover:text-black transition-all text-xs font-bold"
            >
                <Trash2 size={14} /> PURGE_ARENA
            </button>
        </div>

        <div className="mt-auto p-4 border border-service-cyan/20 bg-service-cyan/5 text-[9px] text-service-cyan/60 font-mono">
            &gt; NOTE: WaveSystem is suppressed in Arena Mode.<br/>
            &gt; You have manual control over spawning.
        </div>
    </div>
  );
};
