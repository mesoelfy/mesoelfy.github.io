import { ServiceLocator } from '@/game/core/ServiceLocator';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { EnemyTypes } from '@/game/config/Identifiers';
import { Bug, Trash2, Shield, Plus, Info, Crosshair } from 'lucide-react';
import { useStore } from '@/core/store/useStore';
import { clsx } from 'clsx';

export const ArenaLab = () => {
  const { debugFlags, setDebugFlag } = useStore();

  const spawn = (type: string, count: number = 1) => {
      try {
          const spawner = ServiceLocator.getSpawner();
          const radius = 10;
          for(let i=0; i<count; i++) {
              const angle = Math.random() * Math.PI * 2;
              const r = 5 + Math.random() * radius;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              spawner.spawnEnemy(type, x, y);
          }
          AudioSystem.playSound('ui_click');
      } catch (e) { console.warn("Spawn failed:", e); }
  };

  const clearEnemies = () => {
      try {
          const registry = ServiceLocator.getRegistry();
          const enemies = registry.getByTag('ENEMY');
          enemies.forEach(e => registry.destroyEntity(e.id as number));
          AudioSystem.playSound('ui_error');
      } catch (e) { console.warn("Clear failed:", e); }
  };

  const SpawnBtn = ({ label, type, count, color = "border-service-cyan/30 text-service-cyan" }: any) => (
      <button 
        onClick={() => spawn(type, count)}
        onMouseEnter={() => AudioSystem.playHover()}
        className={`group relative flex items-center justify-between p-3 border bg-black/40 hover:bg-service-cyan/10 transition-all ${color} backdrop-blur-sm`}
      >
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-current opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold font-header tracking-wider group-hover:text-white transition-colors">{label}</span>
              <span className="text-[8px] opacity-60 font-mono">BATCH_SIZE: {count.toString().padStart(2, '0')}</span>
          </div>
          <Plus size={14} className="opacity-50 group-hover:scale-110 transition-transform" />
      </button>
  );

  return (
    <div className="flex flex-col gap-px w-80 pointer-events-auto h-full max-h-[80vh] bg-[#020408]/90 backdrop-blur-md border border-service-cyan/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden mt-10 mr-10">
        
        {/* HEADER */}
        <div className="p-4 border-b border-service-cyan/20 bg-gradient-to-r from-service-cyan/10 to-transparent flex justify-between items-center">
            <h3 className="text-sm font-black font-header tracking-widest text-service-cyan flex items-center gap-2">
                <Bug size={16} /> INJECTION_LAB
            </h3>
            <div className="w-2 h-2 bg-service-cyan rounded-full animate-pulse shadow-[0_0_10px_#00F0FF]" />
        </div>

        {/* CONTROLS */}
        <div className="p-4 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-service-cyan/30">
            
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-service-cyan/50 uppercase tracking-widest mb-1">
                    <Crosshair size={10} /> Hostile Entities
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <SpawnBtn label="DRILLER" type={EnemyTypes.DRILLER} count={1} />
                    <SpawnBtn label="SWARM" type={EnemyTypes.DRILLER} count={5} />
                    <SpawnBtn label="KAMIKAZE" type={EnemyTypes.KAMIKAZE} count={1} color="border-critical-red/30 text-critical-red" />
                    <SpawnBtn label="HUNTER" type={EnemyTypes.HUNTER} count={1} color="border-alert-yellow/30 text-alert-yellow" />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-mono text-latent-purple/50 uppercase tracking-widest mb-1">
                    <Shield size={10} /> Defensive Assets
                </div>
                <SpawnBtn 
                    label="DAEMON_CORE" 
                    type={EnemyTypes.DAEMON} 
                    count={1} 
                    color="border-latent-purple/40 text-latent-purple hover:bg-latent-purple/10" 
                />
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-service-cyan/20 to-transparent w-full" />

            {/* GLOBAL OVERRIDES */}
            <div className="space-y-2">
                <button 
                    onClick={() => setDebugFlag('godMode', !debugFlags.godMode)}
                    className={clsx(
                        "w-full flex items-center justify-between p-3 border text-xs font-bold transition-all backdrop-blur-sm",
                        debugFlags.godMode 
                            ? "bg-service-cyan/20 text-service-cyan border-service-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]" 
                            : "bg-black/40 border-service-cyan/20 text-gray-500 hover:text-service-cyan hover:border-service-cyan/50"
                    )}
                >
                    <span>INVULNERABILITY</span>
                    <Shield size={14} className={debugFlags.godMode ? "fill-current" : ""} />
                </button>

                <button 
                    onClick={clearEnemies}
                    onMouseEnter={() => AudioSystem.playHover()}
                    className="w-full flex items-center justify-center gap-2 p-3 border border-critical-red/30 text-critical-red hover:bg-critical-red hover:text-black transition-all text-xs font-bold backdrop-blur-sm group"
                >
                    <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> 
                    PURGE_ENTITIES
                </button>
            </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-black/60 border-t border-service-cyan/10 text-[9px] text-gray-500 font-mono flex items-start gap-2">
            <Info size={12} className="shrink-0 mt-0.5 text-service-cyan" />
            <p className="leading-relaxed opacity-80">
                Sandbox mode enables free testing of entity interactions. Metrics may vary from live build.
            </p>
        </div>
    </div>
  );
};
