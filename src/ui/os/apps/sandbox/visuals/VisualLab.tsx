import { useState } from 'react';
import { clsx } from 'clsx';
import { AudioSystem } from '@/engine/audio/AudioSystem';
import { Atom, Waves, Zap, MousePointer2 } from 'lucide-react';

const EXPERIMENTS = [
  { id: 'NONE', label: 'STANDBY', icon: Atom },
  { id: 'FLOW', label: 'FLOW_FIELD', icon: Waves },
  { id: 'GLITCH', label: 'VERTEX_JITTER', icon: Zap },
  { id: 'SWARM', label: 'BOID_SWARM', icon: MousePointer2 },
];

export const VisualLab = () => {
  const [activeExp, setActiveExp] = useState('NONE');

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
        {/* TOP LEFT CONTROL PANEL */}
        <div className="absolute top-20 left-10 w-64 bg-[#020408]/90 backdrop-blur-md border border-service-cyan/20 rounded-sm shadow-xl pointer-events-auto p-4">
            <h3 className="text-service-cyan font-header font-black tracking-widest text-xs mb-4 border-b border-service-cyan/20 pb-2">
                VISUAL_CORTEX // LAB
            </h3>
            
            <div className="space-y-2">
                {EXPERIMENTS.map(exp => (
                    <button
                        key={exp.id}
                        onClick={() => { setActiveExp(exp.id); AudioSystem.playClick(); }}
                        onMouseEnter={() => AudioSystem.playHover()}
                        className={clsx(
                            "w-full flex items-center gap-3 px-3 py-2 text-xs font-mono border transition-all",
                            activeExp === exp.id 
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

        {/* CENTER STAGE (3D RENDER TARGET) */}
        <div className="flex-1 w-full h-full flex items-center justify-center">
            {activeExp === 'NONE' && (
                <div className="text-center opacity-30">
                    <Atom size={64} className="mx-auto mb-4 animate-spin-slow text-service-cyan" />
                    <p className="font-mono text-sm text-service-cyan">SELECT_EXPERIMENT</p>
                </div>
            )}
            
            {/* Future Experiments go here */}
            {activeExp === 'FLOW' && <div className="text-service-cyan font-mono animate-pulse">Running Flow Field... (Pending Phase 4)</div>}
        </div>
    </div>
  );
};
