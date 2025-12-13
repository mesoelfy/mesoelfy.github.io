import { useStore } from '@/core/store/useStore';
import { RangeSlider } from '../components/RangeSlider';
import { RotateCcw, Activity, Volume2, VolumeX, Waves, Music, Zap, ZapOff, Wind } from 'lucide-react';
import { AudioSystem } from '@/core/audio/AudioSystem';
import { clsx } from 'clsx';
import { 
  getAmbienceFilterHz, 
  getAmbiencePanFreq, 
  getAmbienceModFreq, 
  getAmbienceModDepth, 
  getAmbienceStereoGain 
} from '@/core/audio/AudioMath';

// Dynamic Toggle Component
const ChannelToggle = ({ label, isActive, onClick, iconOn: IconOn, iconOff: IconOff }: any) => {
  const Icon = isActive ? IconOn : (IconOff || IconOn);
  
  return (
    <button
      onClick={() => { onClick(); AudioSystem.playClick(); }}
      onMouseEnter={() => AudioSystem.playHover()}
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
      {/* UPDATED: Removed fill-current, decreased strokeWidth to 1.5 */}
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

  const BASE_VOL = 0.24;

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
                  Output Gain calibrated to Source (Vol: {BASE_VOL}).
                  DSP Matrix Active.
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: GLOBAL MIXER */}
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                  <Volume2 size={14} className="text-white/70" />
                  <h3 className="text-xs font-bold text-white/90 tracking-wider">GLOBAL_MIXER</h3>
              </div>
              
              <div className="bg-black/40 p-4 border border-white/5 relative overflow-hidden flex flex-col gap-6">
                  <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff_10px,#ffffff_11px)] pointer-events-none" />
                  
                  {/* Channel Toggles Grid */}
                  <div className="grid grid-cols-4 gap-2 relative z-10">
                      <ChannelToggle 
                        label="MAIN" 
                        isActive={audioSettings.master} 
                        onClick={toggleMaster} 
                        iconOn={Volume2} 
                        iconOff={VolumeX} 
                      />
                      <ChannelToggle 
                        label="MUSIC" 
                        isActive={audioSettings.music} 
                        onClick={toggleMusic} 
                        iconOn={Music} 
                        // Music icon stays same, just dimmed (Header style)
                      />
                      <ChannelToggle 
                        label="SFX" 
                        isActive={audioSettings.sfx} 
                        onClick={toggleSfx} 
                        iconOn={Zap} 
                        iconOff={ZapOff}
                      />
                      <ChannelToggle 
                        label="AMB" 
                        isActive={audioSettings.ambience} 
                        onClick={toggleAmbience} 
                        iconOn={Wind} 
                        // Wind icon stays same, dimmed
                      />
                  </div>

                  {/* Sliders */}
                  <div className="space-y-5 relative z-10">
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
          </div>

          {/* RIGHT: AMBIENCE LAB */}
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-alert-yellow/30 pb-2 mb-2">
                  <Waves size={14} className="text-alert-yellow" />
                  <h3 className="text-xs font-bold text-alert-yellow tracking-wider">
                    AMBIENCE_SYNTH <span className="opacity-50 text-[10px] ml-1 font-mono">// (BROWN NOISE FLOOR)</span>
                  </h3>
              </div>

              <div className="space-y-5 bg-alert-yellow/5 p-4 border border-alert-yellow/10 relative">
                  {/* Decorative corner */}
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

                  <div className="grid grid-cols-1 gap-5">
                      <RangeSlider 
                        label="SPECTRAL_GATE (CUTOFF)" 
                        value={audioSettings.ambFilter} 
                        max={1.0} 
                        markerValue={0.5}
                        onChange={(v) => setVolume('ambFilter', v, 1.0)} 
                        format={(v) => `${getAmbienceFilterHz(v).toFixed(0)} Hz`}
                      />
                  </div>
                  
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
