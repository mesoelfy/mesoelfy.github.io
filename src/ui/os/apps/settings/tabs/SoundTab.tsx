import { useStore } from '@/sys/state/global/useStore';
import { RangeSlider } from '../components/RangeSlider';
import { RotateCcw, Activity, Volume2, VolumeX, Waves, Music, Zap, ZapOff, Wind, Mic2 } from 'lucide-react';
import { useAudio } from '@/ui/hooks/useAudio';
import { clsx } from 'clsx';
import { 
  getAmbienceFilterHz, 
  getAmbiencePanFreq, 
  getAmbienceModFreq, 
  getAmbienceModDepth, 
  getAmbienceStereoGain 
} from '@/engine/audio/AudioMath';

const ChannelToggle = ({ label, isActive, onClick, iconOn: IconOn, iconOff: IconOff, audio }: any) => {
  const Icon = isActive ? IconOn : (IconOff || IconOn);
  
  return (
    <button
      onClick={(e) => { onClick(); audio.playClick(); }}
      onMouseEnter={() => audio.playHover()}
      className={clsx(
        "flex flex-col items-center justify-center p-2 border transition-all duration-200 w-full h-14 relative overflow-hidden group",
        isActive 
          ? "bg-primary-green/10 border-primary-green text-primary-green shadow-[inset_0_0_10px_rgba(120,246,84,0.1)]" 
          : "bg-black/40 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
      )}
    >
      {isActive && (
         <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary-green shadow-[0_0_5px_#78F654]" />
      )}
      <Icon 
        size={16} 
        strokeWidth={1.5}
        className={clsx("mb-1 transition-transform", isActive ? "scale-110" : "opacity-50")} 
      />
      <span className="text-[9px] font-bold font-mono tracking-widest">{label}</span>
    </button>
  );
};

export const SoundTab = () => {
  const { 
    audioSettings, 
    setVolume, 
    resetAudioSettings,
    toggleMaster,
    toggleMusic,
    toggleSfx,
    toggleAmbience
  } = useStore();
  
  const audio = useAudio();
  const BASE_VOL = 0.24;

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pr-2">
      
      <div className="p-3 border border-primary-green/30 bg-primary-green/5 flex items-start gap-3">
          <Activity size={16} className="text-primary-green mt-0.5 animate-pulse" />
          <div className="flex flex-col gap-1">
              <span className="text-[10px] font-header font-black text-primary-green tracking-widest uppercase">
                  AUDIO_ENGINE_V2 ONLINE
              </span>
              <p className="text-[9px] font-mono text-primary-green-dim leading-relaxed">
                  Output Gain calibrated to Source (Vol: {BASE_VOL}).
                  DSP Matrix Active.
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: MIXER & FX */}
          <div className="flex flex-col gap-6">
              
              {/* GLOBAL MIXER */}
              <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                      <Volume2 size={14} className="text-white/70" />
                      <h3 className="text-xs font-bold text-white/90 tracking-wider">GLOBAL_MIXER</h3>
                  </div>
                  
                  <div className="bg-black/40 p-4 border border-white/5 relative overflow-hidden flex flex-col gap-6">
                      <div className="grid grid-cols-4 gap-2 relative z-10">
                          <ChannelToggle label="MAIN" isActive={audioSettings.master} onClick={toggleMaster} iconOn={Volume2} iconOff={VolumeX} audio={audio} />
                          <ChannelToggle label="MUSIC" isActive={audioSettings.music} onClick={toggleMusic} iconOn={Music} audio={audio} />
                          <ChannelToggle label="SFX" isActive={audioSettings.sfx} onClick={toggleSfx} iconOn={Zap} iconOff={ZapOff} audio={audio} />
                          <ChannelToggle label="AMB" isActive={audioSettings.ambience} onClick={toggleAmbience} iconOn={Wind} audio={audio} />
                      </div>

                      <div className="space-y-5 relative z-10">
                        <RangeSlider label="MASTER_OUT" value={audioSettings.volumeMaster} max={2.0} onChange={(v) => setVolume('volumeMaster', v, 2.0)} format={(v) => `${(v * 100).toFixed(0)}%`} />
                        <RangeSlider label="MUSIC_BUS" value={audioSettings.volumeMusic} max={2.0} onChange={(v) => setVolume('volumeMusic', v, 2.0)} format={(v) => `${(v * 100).toFixed(0)}%`} />
                        <RangeSlider label="SFX_BUS" value={audioSettings.volumeSfx} max={2.0} onChange={(v) => setVolume('volumeSfx', v, 2.0)} format={(v) => `${(v * 100).toFixed(0)}%`} />
                      </div>
                  </div>
              </div>

              {/* FX RACK */}
              <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-latent-purple/30 pb-2 mb-2">
                      <Mic2 size={14} className="text-latent-purple" />
                      <h3 className="text-xs font-bold text-latent-purple tracking-wider">FX_PROCESSOR</h3>
                  </div>
                  
                  <div className="bg-latent-purple/5 p-4 border border-latent-purple/10 space-y-5 relative">
                      <RangeSlider 
                        label="REVERB_SEND" 
                        value={audioSettings.fxReverbMix} 
                        max={1.0} 
                        onChange={(v) => setVolume('fxReverbMix', v, 1.0)} 
                        format={(v) => `${(v * 100).toFixed(0)}%`}
                        color="text-latent-purple"
                      />
                      <div className="h-px bg-latent-purple/10 w-full" />
                      <RangeSlider 
                        label="DELAY_SEND" 
                        value={audioSettings.fxDelayMix} 
                        max={1.0} 
                        onChange={(v) => setVolume('fxDelayMix', v, 1.0)} 
                        format={(v) => `${(v * 100).toFixed(0)}%`}
                        color="text-latent-purple"
                      />
                      <div className="grid grid-cols-2 gap-4">
                          <RangeSlider 
                            label="DELAY_TIME" 
                            value={audioSettings.fxDelayTime} 
                            max={1.0} 
                            onChange={(v) => setVolume('fxDelayTime', v, 1.0)} 
                            format={(v) => `${(0.1 + v * 0.9).toFixed(2)}s`}
                            color="text-latent-purple"
                          />
                          <RangeSlider 
                            label="FEEDBACK" 
                            value={audioSettings.fxDelayFeedback} 
                            max={0.9} 
                            onChange={(v) => setVolume('fxDelayFeedback', v, 0.9)} 
                            format={(v) => `${(v * 100).toFixed(0)}%`}
                            color="text-latent-purple"
                          />
                      </div>
                  </div>
              </div>
          </div>

          {/* RIGHT COLUMN: AMBIENCE LAB */}
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-alert-yellow/30 pb-2 mb-2">
                  <Waves size={14} className="text-alert-yellow" />
                  <h3 className="text-xs font-bold text-alert-yellow tracking-wider">
                    AMBIENCE_SYNTH <span className="opacity-50 text-[10px] ml-1 font-mono">// (BROWN NOISE)</span>
                  </h3>
              </div>

              <div className="space-y-5 bg-alert-yellow/5 p-4 border border-alert-yellow/10 relative h-full">
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-alert-yellow/30" />

                  <RangeSlider 
                    label="OUTPUT_GAIN" 
                    value={audioSettings.volumeAmbience} 
                    max={5.0} 
                    markerValue={1.0} 
                    onChange={(v) => setVolume('volumeAmbience', v, 5.0)} 
                    color="text-alert-yellow"
                    format={(v) => `VOL: ${(v * BASE_VOL).toFixed(2)}`} 
                  />

                  <div className="h-px bg-alert-yellow/10 w-full" />

                  <RangeSlider 
                    label="SPECTRAL_GATE (CUTOFF)" 
                    value={audioSettings.ambFilter} 
                    max={1.0} 
                    markerValue={0.5}
                    onChange={(v) => setVolume('ambFilter', v, 1.0)} 
                    format={(v) => `${getAmbienceFilterHz(v).toFixed(0)} Hz`}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                      <RangeSlider 
                        label="PAN_RATE" 
                        value={audioSettings.ambSpeed} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambSpeed', v, 1.0)} 
                        format={(v) => `${getAmbiencePanFreq(v).toFixed(2)} Hz`}
                      />
                      <RangeSlider 
                        label="STEREO_IMG" 
                        value={audioSettings.ambWidth} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambWidth', v, 1.0)} 
                        format={(v) => {
                            const gain = getAmbienceStereoGain(v);
                            return `${((gain / 0.8) * 100).toFixed(0)}%`;
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
                        format={(v) => `${getAmbienceModFreq(v).toFixed(1)} Hz`}
                      />
                      <RangeSlider 
                        label="LFO_DEPTH" 
                        value={audioSettings.ambModDepth} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambModDepth', v, 1.0)} 
                        format={(v) => `+/- ${getAmbienceModDepth(v).toFixed(0)} Hz`}
                      />
                  </div>
              </div>
          </div>
      </div>

      <div className="mt-auto pt-4 flex justify-end border-t border-white/10">
        <button 
          onClick={resetAudioSettings}
          onMouseEnter={() => audio.playHover()}
          className="flex items-center gap-2 px-4 py-2 border border-critical-red/50 text-critical-red hover:bg-critical-red hover:text-black font-header font-black text-xs tracking-widest transition-all group"
        >
          <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
          RESET_ALL_MODULES
        </button>
      </div>
    </div>
  );
};
