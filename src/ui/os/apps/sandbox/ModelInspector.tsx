import { useStore } from '@/game/state/global/useStore';
import { EnemyTypes } from '@/game/config/Identifiers';
import { clsx } from 'clsx';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Box, PlayCircle, Crosshair, ChevronRight, Fingerprint, Activity } from 'lucide-react';

const MODELS = [
  // REMOVED: PLAYER_SHIP (No 3D model)
  { id: EnemyTypes.DAEMON, label: 'DAEMON_CORE', desc: 'Defensive Subroutine.', color: 'text-latent-purple' },
  { id: EnemyTypes.DRILLER, label: 'DRILLER_DRONE', desc: 'Standard Melee Unit.', color: 'text-service-cyan' },
  { id: EnemyTypes.KAMIKAZE, label: 'KAMIKAZE_UNIT', desc: 'Volatile Payload.', color: 'text-critical-red' },
  { id: EnemyTypes.HUNTER, label: 'HUNTER_MK1', desc: 'Ranged Ballistic Unit.', color: 'text-alert-yellow' },
];

const STATES = ['IDLE', 'ATTACK', 'SPAWN', 'DIE'] as const;

export const ModelInspector = () => {
  const { galleryTarget, setGalleryTarget, galleryAction, setGalleryAction } = useStore();
  const currentModel = MODELS.find(m => m.id === galleryTarget) || MODELS[0];

  return (
    <div className="flex flex-col h-full pointer-events-auto relative">
        
        {/* --- LEFT PANEL: LIST --- */}
        <div className="absolute top-10 left-10 w-72 bg-[#020408]/90 backdrop-blur-md border border-service-cyan/20 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-sm">
            <div className="p-4 border-b border-service-cyan/20 bg-service-cyan/5">
                <h3 className="text-service-cyan text-xs font-black font-header tracking-widest flex items-center gap-2">
                    <Box size={14} /> ASSET_DATABASE
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-service-cyan/20">
                {MODELS.map(model => {
                    const isActive = galleryTarget === model.id;
                    return (
                        <button
                            key={model.id}
                            onClick={() => { setGalleryTarget(model.id); AudioSystem.playClick(); }}
                            onMouseEnter={() => AudioSystem.playHover()}
                            className={clsx(
                                "w-full text-left p-4 border-b border-white/5 transition-all group relative overflow-hidden",
                                isActive ? "bg-white/5" : "hover:bg-white/5"
                            )}
                        >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-service-cyan shadow-[0_0_15px_#00F0FF]" />}
                            
                            <div className="flex justify-between items-center mb-1">
                                <span className={clsx("font-header font-bold text-xs tracking-wider transition-colors", isActive ? model.color : "text-gray-400 group-hover:text-white")}>
                                    {model.label}
                                </span>
                                {isActive && <ChevronRight size={14} className={model.color} />}
                            </div>
                            <div className="text-[9px] font-mono text-gray-600 group-hover:text-gray-400 transition-colors">
                                {model.desc}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* --- BOTTOM RIGHT: CONTROLS --- */}
        <div className="absolute bottom-10 right-10 w-80 bg-[#020408]/90 backdrop-blur-md border border-service-cyan/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-sm">
            <div className="p-3 border-b border-service-cyan/20 bg-service-cyan/5 flex justify-between items-center">
                <span className="text-service-cyan text-[10px] font-bold font-header tracking-widest flex items-center gap-2">
                    <Activity size={14} /> ANIMATION_STATE
                </span>
                <PlayCircle size={14} className="text-service-cyan animate-pulse" />
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
                {STATES.map(state => (
                    <button
                        key={state}
                        onClick={() => { setGalleryAction(state); AudioSystem.playClick(); }}
                        className={clsx(
                            "text-[10px] font-bold font-mono text-center py-3 border transition-all rounded-sm relative overflow-hidden group",
                            galleryAction === state
                                ? "border-service-cyan text-black bg-service-cyan shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                                : "border-white/10 text-gray-500 hover:border-service-cyan/50 hover:text-service-cyan hover:bg-service-cyan/5"
                        )}
                    >
                        {state}
                    </button>
                ))}
            </div>
        </div>

        {/* --- TOP RIGHT: METADATA OVERLAY --- */}
        <div className="absolute top-10 right-10 text-right pointer-events-none">
             <div className="flex flex-col items-end gap-2">
                 <h1 className={clsx("text-5xl font-header font-black tracking-tighter opacity-80 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]", currentModel.color)}>
                     {currentModel.label}
                 </h1>
                 
                 <div className="flex items-center gap-4 text-xs font-mono text-gray-400 bg-black/60 px-4 py-2 border border-white/10 rounded-full backdrop-blur-sm">
                     <span className="flex items-center gap-2">
                        <Crosshair size={12} /> ID: {currentModel.id}
                     </span>
                     <span className="w-px h-3 bg-white/20" />
                     <span className="flex items-center gap-2">
                        <Fingerprint size={12} /> VER: 2.0.4
                     </span>
                 </div>
             </div>
        </div>
    </div>
  );
};
