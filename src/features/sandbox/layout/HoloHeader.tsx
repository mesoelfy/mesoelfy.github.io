import { useStore } from '@/core/store/useStore';
import { Clock, Cpu, Server, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

const StatPill = ({ icon: Icon, label, value, color = "text-service-cyan" }: any) => (
  <div className="flex items-center gap-3 px-3 py-1 bg-black/40 border border-white/5 rounded-full">
    <Icon size={12} className={`${color} opacity-80`} />
    <span className="text-[9px] font-bold text-gray-500 uppercase">{label}</span>
    <span className={`text-[10px] font-mono ${color}`}>{value}</span>
  </div>
);

export const HoloHeader = () => {
  const { debugFlags, setDebugFlag } = useStore();

  return (
    <div className="h-10 flex items-center justify-between px-4 text-[10px] font-mono select-none border-b border-white/5">
      
      {/* LEFT: Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-service-cyan border-t-transparent rounded-full"
            />
            <span className="font-header font-black tracking-widest text-service-cyan text-sm drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                HOLO_DECK <span className="opacity-50 text-[10px]">// v.0.9.2</span>
            </span>
        </div>
      </div>

      {/* CENTER: Data Stream Visualization (Abstract) */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-1 opacity-30 mx-8">
          {Array.from({ length: 32 }).map((_, i) => (
              <motion.div 
                key={i}
                className="w-0.5 bg-service-cyan"
                animate={{ height: [4, 12, 4] }}
                transition={{ 
                    duration: 0.5 + Math.random(), 
                    repeat: Infinity, 
                    delay: Math.random() * 0.5 
                }}
              />
          ))}
      </div>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 group mr-4">
            <span className="text-service-cyan/50 font-bold">SIM_SPEED:</span>
            <input 
                type="range" 
                min="0.0" max="2.0" step="0.1"
                value={debugFlags.timeScale}
                onChange={(e) => setDebugFlag('timeScale', parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-service-cyan/20 rounded-full appearance-none cursor-pointer accent-service-cyan hover:accent-white transition-all"
            />
            <span className="w-8 text-right font-bold text-white bg-service-cyan/20 px-1 rounded">
                {debugFlags.timeScale.toFixed(1)}x
            </span>
        </div>
        
        <StatPill icon={Cpu} label="CPU" value="OPTIMAL" />
        <StatPill icon={Server} label="MEM" value="UNLIMITED" color="text-latent-purple" />
      </div>
    </div>
  );
};
