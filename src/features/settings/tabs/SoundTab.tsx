import { useStore } from '@/core/store/useStore';
import { RangeSlider } from '../components/RangeSlider';
import { RotateCcw, Info } from 'lucide-react';

export const SoundTab = () => {
  const { audioSettings, setVolume, resetAudioSettings } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* SECTION 1: GLOBAL MIXER */}
      <div className="space-y-4">
        <h3 className="text-sm font-header font-black text-primary-green border-b border-primary-green/30 pb-2 mb-4 tracking-widest flex justify-between items-center">
          <span>GLOBAL_MIXER</span>
          <span className="text-[9px] font-mono opacity-50">HEADROOM: 200%</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <RangeSlider 
            label="MASTER_GAIN" 
            value={audioSettings.volumeMaster} 
            onChange={(v) => setVolume('volumeMaster', v)} 
          />
          <RangeSlider 
            label="MUSIC_LEVEL" 
            value={audioSettings.volumeMusic} 
            onChange={(v) => setVolume('volumeMusic', v)} 
          />
          <RangeSlider 
            label="SFX_LEVEL" 
            value={audioSettings.volumeSfx} 
            onChange={(v) => setVolume('volumeSfx', v)} 
          />
          <RangeSlider 
            label="AMBIENCE_LEVEL" 
            value={audioSettings.volumeAmbience} 
            onChange={(v) => setVolume('volumeAmbience', v)} 
          />
        </div>
      </div>

      {/* SECTION 2: AMBIENCE LAB (5 KNOBS) */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between border-b border-alert-yellow/30 pb-2 mb-4">
            <h3 className="text-sm font-header font-black text-alert-yellow tracking-widest">
              AMBIENCE_LAB // NOISE_FLOOR_SYNTH
            </h3>
            <div className="flex items-center gap-2 text-[9px] text-alert-yellow opacity-70">
                <Info size={12} />
                <span>PROCEDURAL_GENERATION</span>
            </div>
        </div>

        <p className="text-[10px] font-mono text-gray-400 mb-6 max-w-2xl leading-relaxed">
          The "Noise Floor" is a generative background hum designed to prevent digital silence. 
          Modify the physics below to reshape the room acoustics in real-time.
        </p>

        {/* ROW 1: TONE & SPACE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <RangeSlider 
            label="DENSITY (FILTER)" 
            value={audioSettings.ambFilter} 
            max={4.0}
            onChange={(v) => setVolume('ambFilter', v, 4.0)} 
            color="accent-alert-yellow"
            // Math: 300 * (0.5 + val)
            format={(v) => `${(300 * (0.5 + v)).toFixed(0)} Hz`}
          />
          <RangeSlider 
            label="WIDTH (STEREO)" 
            value={audioSettings.ambWidth}
            max={4.0} 
            onChange={(v) => setVolume('ambWidth', v, 4.0)} 
            color="accent-alert-yellow"
            // Math: 0.2 * val (Gain)
            format={(v) => `${(v * 20).toFixed(0)}% Sep`}
          />
        </div>

        {/* ROW 2: MOVEMENT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RangeSlider 
            label="CIRCULATION (PAN_SPEED)" 
            value={audioSettings.ambSpeed} 
            max={4.0}
            onChange={(v) => setVolume('ambSpeed', v, 4.0)} 
            color="accent-alert-yellow"
            // Math: 0.05 * (0.5 + val) -> Convert Hz to Seconds
            format={(v) => {
                const hz = 0.05 * (0.5 + v);
                return `${(1/hz).toFixed(1)}s Cycle`;
            }}
          />
          <RangeSlider 
            label="FLUCTUATION (MOD_SPEED)" 
            value={audioSettings.ambModSpeed} 
            max={4.0}
            onChange={(v) => setVolume('ambModSpeed', v, 4.0)} 
            color="accent-alert-yellow"
            // Math: 0.2 * (0.5 + val) -> Convert Hz to Seconds
            format={(v) => {
                const hz = 0.2 * (0.5 + v);
                return `${(1/hz).toFixed(1)}s Breath`;
            }}
          />
          <RangeSlider 
            label="INSTABILITY (MOD_DEPTH)" 
            value={audioSettings.ambModDepth} 
            max={4.0}
            onChange={(v) => setVolume('ambModDepth', v, 4.0)} 
            color="accent-alert-yellow"
            // Math: 20 * val (Hz Depth)
            format={(v) => `+/- ${(20 * v).toFixed(0)} Hz`}
          />
        </div>
      </div>

      {/* SECTION 3: ACTIONS */}
      <div className="pt-8 flex justify-end">
        <button 
          onClick={resetAudioSettings}
          className="flex items-center gap-2 px-4 py-2 border border-critical-red/50 text-critical-red hover:bg-critical-red hover:text-black font-mono text-xs font-bold transition-all"
        >
          <RotateCcw size={14} />
          FACTORY_RESET
        </button>
      </div>

    </div>
  );
};
