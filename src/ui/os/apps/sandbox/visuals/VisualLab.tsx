import { useState } from 'react';
import { clsx } from 'clsx';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { useStore, LabExperiment } from '@/engine/state/global/useStore';
import { Atom, Zap, RefreshCcw, Droplets, ZapOff, Info, Layers } from 'lucide-react';
import { RangeSlider } from '@/ui/os/apps/settings/components/RangeSlider';
import { DOM_ID } from '@/ui/config/DOMConfig';

const EXPERIMENTS: { id: LabExperiment, label: string, icon: any }[] = [
  { id: 'NONE', label: 'STANDBY', icon: Atom },
  { id: 'GLITCH', label: 'GLITCH_GHOST', icon: Zap },
  { id: 'SPITTER', label: 'SPITTER_PROTO', icon: Droplets },
];

export const VisualLab = () => {
  const { labExperiment, setLabExperiment, labDetail, setLabDetail } = useStore();
  const [paramA, setParamA] = useState(0.5);

  // Math for Icosahedron subdivisions
  const calculateStats = (detail: number) => {
      // Formula: Vertices = 10 * 4^d + 2
      // Formula: Faces = 20 * 4^d
      const d = Math.floor(detail);
      const verts = 10 * Math.pow(4, d) + 2;
      const faces = 20 * Math.pow(4, d);
      return { verts, faces };
  };

  const stats = calculateStats(labDetail);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
        <div className="absolute top-20 left-10 w-80 bg-[#020408]/90 backdrop-blur-md border border-service-cyan/20 rounded-sm shadow-xl pointer-events-auto p-4 flex flex-col gap-6">
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
            
            {labExperiment !== 'NONE' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    
                    {/* Distortion Slider */}
                    <div className="space-y-2">
                        <div className="text-[10px] text-service-cyan/60 font-bold uppercase tracking-widest">
                            {labExperiment === 'GLITCH' ? "CORRUPTION" : "DISTORTION"}
                        </div>
                        <RangeSlider 
                            label="INTENSITY" 
                            value={paramA} 
                            max={labExperiment === 'GLITCH' ? 2.0 : 1.0} 
                            onChange={setParamA} 
                            color="text-service-cyan"
                        />
                    </div>

                    {/* Detail Slider (Updated to 20) */}
                    <div className="space-y-2">
                        <div className="text-[10px] text-service-cyan/60 font-bold uppercase tracking-widest flex justify-between">
                            <span>GEOMETRY_DETAIL</span>
                            <span className="text-white">{labDetail}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="20" step="1"
                            value={labDetail}
                            onChange={(e) => setLabDetail(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-service-cyan/20 rounded-full appearance-none cursor-pointer accent-service-cyan hover:accent-white transition-all"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-gray-500">
                            <span>LOW (0)</span>
                            <span>GODLIKE (20)</span>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-black/40 border border-service-cyan/20 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-service-cyan border-b border-service-cyan/10 pb-1">
                            <Layers size={12} /> MESH_TOPOLOGY
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[9px] font-mono text-gray-400">
                            <div>
                                <span className="block text-gray-600">VERTICES</span>
                                <span className="text-white text-xs">{stats.verts.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-600">FACES</span>
                                <span className="text-white text-xs">{stats.faces.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-service-cyan/10 flex items-start gap-2">
                            <Info size={12} className="text-service-cyan shrink-0 mt-0.5" />
                            <p className="text-[9px] leading-tight text-gray-500">
                                <strong>Warning:</strong> High detail levels increase render cost exponentially ($4^d$). 
                                <br/><br/>
                                <span className="text-service-cyan">Detail &gt; 7 may cause GPU hang.</span>
                            </p>
                        </div>
                    </div>

                </div>
            )}
        </div>
        
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
        <div id={DOM_ID.LAB_PARAMS} data-a={paramA} className="hidden" />
    </div>
  );
};
