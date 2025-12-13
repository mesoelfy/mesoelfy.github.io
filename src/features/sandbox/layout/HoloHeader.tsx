import { useStore } from '@/core/store/useStore';
import { Clock, Cpu } from 'lucide-react';

export const HoloHeader = () => {
  const { debugFlags, setDebugFlag } = useStore();

  return (
    <div className="h-8 flex items-center justify-between px-4 bg-black border-b border-service-cyan/20 text-[10px] font-mono text-service-cyan/60 select-none">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-service-cyan rounded-full animate-pulse shadow-[0_0_5px_#00F0FF]" />
            SIMULATION_ACTIVE
        </span>
        <span className="opacity-50">build_ver: DEV_SANDBOX</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 group">
            <Clock size={12} className="group-hover:text-service-cyan transition-colors" />
            <input 
                type="range" 
                min="0.0" max="2.0" step="0.1"
                value={debugFlags.timeScale}
                onChange={(e) => setDebugFlag('timeScale', parseFloat(e.target.value))}
                className="w-20 h-1 bg-service-cyan/20 rounded-full appearance-none cursor-pointer accent-service-cyan"
            />
            <span className="w-8 text-right font-bold text-service-cyan">{debugFlags.timeScale.toFixed(1)}x</span>
        </div>
        
        <div className="flex items-center gap-2">
            <Cpu size={12} />
            <span>MEM: UNLIMITED</span>
        </div>
      </div>
    </div>
  );
};
