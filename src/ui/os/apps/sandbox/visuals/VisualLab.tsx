import { useState } from 'react';
import { clsx } from 'clsx';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useStore, LabExperiment } from '@/engine/state/global/useStore';
import { Atom, Zap, RefreshCcw } from 'lucide-react';
import { RangeSlider } from '@/ui/os/apps/settings/components/RangeSlider';

const EXPERIMENTS: { id: LabExperiment, label: string, icon: any }[] = [
  { id: 'NONE', label: 'STANDBY', icon: Atom },
  { id: 'GLITCH', label: 'GLITCH_GHOST', icon: Zap },
];

export const VisualLab = () => {
  const { labExperiment, setLabExperiment } = useStore();
  const [paramA, setParamA] = useState(0.5);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
        
        {/* TOP LEFT: CONTROL PANEL */}
        <div className="absolute top-20 left-10 w-72 bg-[#020408]/90 backdrop-blur-md border border-service-cyan/20 rounded-sm shadow-xl pointer-events-auto p-4 flex flex-col gap-6">
            <div>
                <h3 className="text-service-cyan font-header font-black tracking-widest text-xs mb-2 border-b border-service-cyan/20 pb-2 flex justify-between items-center">
                    <span>VISUAL_CORTEX</span>
                    <RefreshCcw size={12} className="opacity-50" />
                </h3>
                <div className="space-y-1">
                    {EXPERIMENTS.map(exp => (
                        <button
                            key={exp.id}
                            onClick={() => { setLabExperiment(exp.id); AudioSystem.playClick(); }}
                            onMouseEnter={() => AudioSystem.playHover()}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2 text-xs font-mono border transition-all",
                                labExperiment === exp.id 
                                    ? "bg-service-cyan/20 border-service-cyan text-service-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]" 
                                    : "bg-black/40 border-white/5 text-gray-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <exp.icon size={14} />
                            {exp.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* DYNAMIC CONTROLS */}
            {labExperiment === 'GLITCH' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[10px] text-service-cyan/60 font-bold uppercase tracking-widest">Parameters</div>
                    <RangeSlider 
                        label="CORRUPTION" 
                        value={paramA} 
                        max={2.0} 
                        onChange={setParamA} 
                        color="text-service-cyan"
                    />
                </div>
            )}
        </div>

        {/* CENTER: STANDBY UI */}
        {labExperiment === 'NONE' && (
            <div className="flex-1 w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center opacity-50 flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-service-cyan blur-2xl opacity-20 animate-pulse" />
                        <Atom size={80} className="relative z-10 text-service-cyan animate-spin-slow" strokeWidth={1} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-header font-black text-xl text-service-cyan tracking-[0.2em]">AWAITING_INPUT</span>
                        <span className="font-mono text-xs text-service-cyan/60">SELECT EXPERIMENT TO INITIALIZE</span>
                    </div>
                </div>
            </div>
        )}

        {/* DATA BRIDGE */}
        <div id="lab-params" data-a={paramA} className="hidden" />
    </div>
  );
};
