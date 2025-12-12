import { useStore } from '@/core/store/useStore';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { Zap, ZapOff, Cpu, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export const GpuConfigPanel = () => {
  const { graphicsMode, setGraphicsMode } = useStore();

  const handleSelect = (mode: 'HIGH' | 'POTATO') => {
    if (graphicsMode === mode) return;
    AudioSystem.playClick();
    setGraphicsMode(mode);
  };

  return (
    <div className="flex flex-col border border-primary-green bg-black/90 w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary-green/30 bg-primary-green/5 shrink-0">
        <span className="font-mono font-bold text-sm tracking-widest text-primary-green">
          GPU_CONFIG
        </span>
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-primary-green animate-pulse" />
        </div>
      </div>

      {/* BODY - No padding, full width buttons */}
      <div className="flex flex-col w-full h-full bg-black relative">
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#15530A 1px, transparent 1px)', backgroundSize: '8px 8px' }} 
        />

        <div className="p-3 border-b border-primary-green/20">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Activity size={10} /> SELECT PROFILE:
            </span>
        </div>

        {/* HIGH VOLTAGE TOGGLE */}
        <button
          onClick={() => handleSelect('HIGH')}
          onMouseEnter={() => AudioSystem.playHover()}
          className="group relative w-full h-24 flex items-stretch border-b border-primary-green/30 overflow-hidden transition-all hover:bg-white/5"
        >
          {/* Status Strip (Left) */}
          <div className={clsx(
              "w-2 h-full transition-colors duration-300", 
              graphicsMode === 'HIGH' ? "bg-primary-green shadow-[0_0_15px_#78F654]" : "bg-gray-800"
          )} />
          
          {/* Content */}
          <div className="flex-1 flex items-center justify-between px-4 relative z-10">
             <div className="flex flex-col items-start text-left">
                <span className={clsx(
                    "font-header font-black text-xl tracking-widest transition-colors duration-300",
                    graphicsMode === 'HIGH' ? "text-primary-green" : "text-gray-500 group-hover:text-primary-green-dim"
                )}>
                    ENABLED
                </span>
                <span className="text-[10px] font-mono tracking-widest text-gray-500 group-hover:text-white transition-colors">
                    [HIGH_VOLTAGE]
                </span>
             </div>
             
             <Zap 
                size={28} 
                className={clsx(
                    "transition-all duration-300",
                    graphicsMode === 'HIGH' ? "text-primary-green fill-primary-green scale-110" : "text-gray-700 scale-90"
                )} 
             />
          </div>

          {/* Active Background Pattern */}
          {graphicsMode === 'HIGH' && (
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#78F654_10px,#78F654_12px)]" />
          )}
        </button>

        {/* POTATO MODE TOGGLE */}
        <button
          onClick={() => handleSelect('POTATO')}
          onMouseEnter={() => AudioSystem.playHover()}
          className="group relative w-full h-24 flex items-stretch overflow-hidden transition-all hover:bg-white/5"
        >
          {/* Status Strip (Left) */}
          <div className={clsx(
              "w-2 h-full transition-colors duration-300", 
              graphicsMode === 'POTATO' ? "bg-alert-yellow shadow-[0_0_15px_#eae747]" : "bg-gray-800"
          )} />
          
          {/* Content */}
          <div className="flex-1 flex items-center justify-between px-4 relative z-10">
             <div className="flex flex-col items-start text-left">
                <span className={clsx(
                    "font-header font-black text-xl tracking-widest transition-colors duration-300",
                    graphicsMode === 'POTATO' ? "text-alert-yellow" : "text-gray-500 group-hover:text-alert-yellow/70"
                )}>
                    DISABLED
                </span>
                <span className="text-[10px] font-mono tracking-widest text-gray-500 group-hover:text-white transition-colors">
                    [POTATO_MODE]
                </span>
             </div>
             
             <ZapOff 
                size={28} 
                className={clsx(
                    "transition-all duration-300",
                    graphicsMode === 'POTATO' ? "text-alert-yellow fill-alert-yellow scale-110" : "text-gray-700 scale-90"
                )} 
             />
          </div>

          {/* Active Background Pattern */}
          {graphicsMode === 'POTATO' && (
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#eae747_10px,#eae747_12px)]" />
          )}
        </button>
      </div>
    </div>
  );
};
