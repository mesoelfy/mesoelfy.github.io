import { useStore } from '@/core/store/useStore';
import { RangeSlider } from '../components/RangeSlider';
import { RotateCcw, Activity, Volume2, Sliders, Waves } from 'lucide-react';
import { AudioSystem } from '@/core/audio/AudioSystem';

export const SoundTab = () => {
  const { audioSettings, setVolume, resetAudioSettings } = useStore();

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pr-2">
      
      {/* HEADER ALERT */}
      <div className="p-3 border border-primary-green/30 bg-primary-green/5 flex items-start gap-3">
          <Activity size={16} className="text-primary-green mt-0.5 animate-pulse" />
          <div className="flex flex-col gap-1">
              <span className="text-[10px] font-header font-black text-primary-green tracking-widest uppercase">
                  AUDIO_ENGINE_V2 ONLINE
              </span>
              <p className="text-[9px] font-mono text-primary-green-dim leading-relaxed">
                  Proceed with caution. Ambience gain has been uncapped (300%). 
                  Signal degradation modules active.
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: MASTER MIXER */}
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                  <Volume2 size={14} className="text-white/70" />
                  <h3 className="text-xs font-bold text-white/90 tracking-wider">GLOBAL_MIXER</h3>
              </div>
              
              <div className="space-y-6 bg-black/40 p-4 border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff_10px,#ffffff_11px)] pointer-events-none" />
                  
                  <RangeSlider 
                    label="MASTER_OUT" 
                    value={audioSettings.volumeMaster} 
                    max={2.0}
                    onChange={(v) => setVolume('volumeMaster', v, 2.0)} 
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <RangeSlider 
                    label="MUSIC_BUS" 
                    value={audioSettings.volumeMusic} 
                    max={2.0}
                    onChange={(v) => setVolume('volumeMusic', v, 2.0)} 
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <RangeSlider 
                    label="SFX_BUS" 
                    value={audioSettings.volumeSfx} 
                    max={2.0}
                    onChange={(v) => setVolume('volumeSfx', v, 2.0)} 
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
              </div>
          </div>

          {/* RIGHT: AMBIENCE LAB */}
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-alert-yellow/30 pb-2 mb-2">
                  <Waves size={14} className="text-alert-yellow" />
                  <h3 className="text-xs font-bold text-alert-yellow tracking-wider">AMBIENCE_SYNTH</h3>
              </div>

              <div className="space-y-5 bg-alert-yellow/5 p-4 border border-alert-yellow/10 relative">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-alert-yellow/30" />

                  <RangeSlider 
                    label="OUTPUT_GAIN (300%)" 
                    value={audioSettings.volumeAmbience} 
                    max={2.0}
                    onChange={(v) => setVolume('volumeAmbience', v, 2.0)} 
                    color="text-alert-yellow"
                    format={(v) => `${(v * 150).toFixed(0)}%`} // Display 1.0 as 150% (visual hack, actual is 300% via boost)
                  />

                  <div className="h-px bg-alert-yellow/10 w-full" />

                  <div className="grid grid-cols-1 gap-5">
                      <RangeSlider 
                        label="SPECTRAL_GATE (CUTOFF)" 
                        value={audioSettings.ambFilter} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambFilter', v, 1.0)} 
                        format={(v) => {
                            // 300 * 10^((v-0.5)*2)
                            const hz = 300 * Math.pow(10, (v - 0.5) * 2);
                            return `${hz.toFixed(0)}Hz`;
                        }}
                      />
                      <RangeSlider 
                        label="SIGNAL_DEGRADATION (GRIT)" 
                        value={audioSettings.ambGrit} 
                        max={1.0} 
                        markerValue={0.0}
                        onChange={(v) => setVolume('ambGrit', v, 1.0)} 
                        format={(v) => `${(v * 100).toFixed(0)}%`}
                        color="text-critical-red"
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <RangeSlider 
                        label="PAN_RATE" 
                        value={audioSettings.ambSpeed} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambSpeed', v, 1.0)} 
                        format={(v) => {
                            // 0.05 * 10^((v-0.5)*2)
                            const val = 0.05 * Math.pow(10, (v - 0.5) * 2);
                            return `${val.toFixed(2)}Hz`;
                        }}
                      />
                      <RangeSlider 
                        label="STEREO_IMG" 
                        value={audioSettings.ambWidth} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambWidth', v, 1.0)} 
                        format={(v) => {
                            // v^3 * 80
                            return `${(Math.pow(v, 3) * 80).toFixed(0)}%`;
                        }}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <RangeSlider 
                        label="LFO_RATE" 
                        value={audioSettings.ambModSpeed} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambModSpeed', v, 1.0)} 
                        format={(v) => {
                            // 0.2 * 10^((v-0.5)*2)
                            const val = 0.2 * Math.pow(10, (v - 0.5) * 2);
                            return `${val.toFixed(2)}Hz`;
                        }}
                      />
                      <RangeSlider 
                        label="LFO_DEPTH" 
                        value={audioSettings.ambModDepth} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambModDepth', v, 1.0)} 
                        format={(v) => {
                            // 10 * 10^((v-0.5)*2)
                            const val = 10 * Math.pow(10, (v - 0.5) * 2);
                            return `+/- ${val.toFixed(0)}Hz`;
                        }}
                      />
                  </div>
              </div>
          </div>
      </div>

      <div className="mt-auto pt-4 flex justify-end border-t border-white/10">
        <button 
          onClick={resetAudioSettings}
          onMouseEnter={() => AudioSystem.playHover()}
          className="flex items-center gap-2 px-4 py-2 border border-critical-red/50 text-critical-red hover:bg-critical-red hover:text-black font-header font-black text-xs tracking-widest transition-all group"
        >
          <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
          RESET_ALL_MODULES
        </button>
      </div>
    </div>
  );
};
