import { useStore } from '@/core/store/useStore';
import { EnemyTypes } from '@/game/config/Identifiers';
import { clsx } from 'clsx';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Box, PlayCircle, Skull, Crosshair } from 'lucide-react';

const MODELS = [
  { id: EnemyTypes.DRILLER, label: 'DRILLER_DRONE' },
  { id: EnemyTypes.KAMIKAZE, label: 'KAMIKAZE_UNIT' },
  { id: EnemyTypes.HUNTER, label: 'HUNTER_MK1' },
  { id: EnemyTypes.DAEMON, label: 'DAEMON_CORE' },
  { id: 'PLAYER', label: 'PLAYER_SHIP' },
];

const STATES = ['IDLE', 'ATTACK', 'SPAWN', 'DIE'] as const;

export const ModelInspector = () => {
  const { galleryTarget, setGalleryTarget, galleryAction, setGalleryAction } = useStore();

  return (
    <div className="flex flex-col h-full pointer-events-auto">
        <div className="flex-1" /> {/* Spacer to push controls to bottom/side */}
        
        {/* Controls Overlay */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-4 w-64">
            
            {/* Model Selector */}
            <div className="bg-black/80 backdrop-blur-md border border-service-cyan/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-service-cyan text-xs font-bold border-b border-service-cyan/20 pb-2 mb-1">
                    <Box size={14} /> SELECT_MODEL
                </div>
                <div className="grid grid-cols-1 gap-1">
                    {MODELS.map(model => (
                        <button
                            key={model.id}
                            onClick={() => { setGalleryTarget(model.id); AudioSystem.playClick(); }}
                            onMouseEnter={() => AudioSystem.playHover()}
                            className={clsx(
                                "text-[10px] font-mono text-left px-3 py-2 transition-all border-l-2",
                                galleryTarget === model.id 
                                    ? "border-service-cyan bg-service-cyan/10 text-service-cyan font-bold"
                                    : "border-transparent text-gray-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {model.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action State */}
            <div className="bg-black/80 backdrop-blur-md border border-service-cyan/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-service-cyan text-xs font-bold border-b border-service-cyan/20 pb-2 mb-1">
                    <PlayCircle size={14} /> BEHAVIOR_STATE
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {STATES.map(state => (
                        <button
                            key={state}
                            onClick={() => { setGalleryAction(state); AudioSystem.playClick(); }}
                            className={clsx(
                                "text-[9px] font-mono text-center py-1.5 border transition-all",
                                galleryAction === state
                                    ? "border-service-cyan bg-service-cyan text-black font-bold"
                                    : "border-service-cyan/30 text-service-cyan/60 hover:text-service-cyan hover:border-service-cyan"
                            )}
                        >
                            {state}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Stats / Info Overlay (Top Right) */}
        <div className="absolute top-24 right-6 bg-black/80 backdrop-blur-md border border-service-cyan/30 p-4 w-64">
             <div className="flex items-center justify-between text-service-cyan text-xs font-bold mb-2">
                <span>ENTITY_DATA</span>
                <Crosshair size={14} />
             </div>
             <div className="space-y-1 font-mono text-[10px] text-gray-400">
                 <div className="flex justify-between">
                     <span>TYPE:</span>
                     <span className="text-white">{galleryTarget}</span>
                 </div>
                 <div className="flex justify-between">
                     <span>POLY_COUNT:</span>
                     <span className="text-white">LOW_POLY</span>
                 </div>
                 <div className="flex justify-between">
                     <span>RENDER:</span>
                     <span className="text-white">R3F_SHADER</span>
                 </div>
             </div>
        </div>
    </div>
  );
};
