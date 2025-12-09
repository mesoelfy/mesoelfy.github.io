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
          <span className="text-[9px] font-mono opacity-50">HEADROOM: 300%</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <RangeSlider 
            label="MASTER_GAIN" 
            value={audioSettings.volumeMaster} 
            max={3.0}
            displayMax={300}
            onChange={(v) => setVolume('volumeMaster', v, 3.0)} 
          />
          <RangeSlider 
            label="MUSIC_LEVEL" 
            value={audioSettings.volumeMusic} 
            max={3.0}
            displayMax={300}
            onChange={(v) => setVolume('volumeMusic', v, 3.0)} 
          />
          <RangeSlider 
            label="SFX_LEVEL" 
            value={audioSettings.volumeSfx} 
            max={3.0}
            displayMax={300}
            onChange={(v) => setVolume('volumeSfx', v, 3.0)} 
          />
          <RangeSlider 
            label="AMBIENCE_LEVEL" 
            value={audioSettings.volumeAmbience} 
            max={3.0}
            displayMax={300}
            onChange={(v) => setVolume('volumeAmbience', v, 3.0)} 
          />
        </div>
      </div>

      {/* SECTION 2: AMBIENCE LAB (CALIBRATED) */}
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
          The "Noise Floor" prevents digital silence. 
          Modify the physics below to reshape the room acoustics in real-time.
        </p>

        {/* ROW 1: TONE & SPACE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <RangeSlider 
            label="DENSITY (FILTER)" 
            value={audioSettings.ambFilter * 100} 
            max={100}
            markerValue={50}
            onChange={(v) => setVolume('ambFilter', v / 100, 1.0)} 
            color="accent-alert-yellow"
            // Math: 300 * 10^((val-0.5)*2)
            format={(v) => {
                const norm = v / 100;
                const hz = 300 * Math.pow(10, (norm - 0.5) * 2);
                return `${hz.toFixed(0)} Hz`;
            }}
          />
          <RangeSlider 
            label="WIDTH (STEREO)" 
            value={audioSettings.ambWidth * 100}
            max={100} 
            markerValue={50}
            onChange={(v) => setVolume('ambWidth', v / 100, 1.0)} 
            color="accent-alert-yellow"
            format={(v) => {
                const norm = v / 100;
                return `${(Math.pow(norm, 3) * 80).toFixed(0)}% Sep`;
            }}
          />
        </div>

        {/* ROW 2: MOVEMENT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RangeSlider 
            label="CIRCULATION (SPEED)" 
            value={audioSettings.ambSpeed * 100} 
            max={100}
            markerValue={50}
            onChange={(v) => setVolume('ambSpeed', v / 100, 1.0)} 
            color="accent-alert-yellow"
            format={(v) => {
                const norm = v / 100;
                const hz = 0.05 * Math.pow(10, (norm - 0.5) * 2);
                return `${(1/hz).toFixed(1)}s`;
            }}
          />
          <RangeSlider 
            label="FLUCTUATION (MOD)" 
            value={audioSettings.ambModSpeed * 100} 
            max={100}
            markerValue={50}
            onChange={(v) => setVolume('ambModSpeed', v / 100, 1.0)} 
            color="accent-alert-yellow"
            format={(v) => {
                const norm = v / 100;
                const hz = 0.2 * Math.pow(10, (norm - 0.5) * 2);
                return `${(1/hz).toFixed(1)}s`;
            }}
          />
          <RangeSlider 
            label="INSTABILITY (DEPTH)" 
            value={audioSettings.ambModDepth * 100} 
            max={100}
            markerValue={50}
            onChange={(v) => setVolume('ambModDepth', v / 100, 1.0)} 
            color="accent-alert-yellow"
            format={(v) => `+/- ${(10 * Math.pow(10, (v/100 - 0.5) * 2)).toFixed(0)} Hz`}
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
