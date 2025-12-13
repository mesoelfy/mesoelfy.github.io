import { AudioContextManager } from './AudioContextManager';
import { 
  getAmbienceFilterHz, 
  getAmbiencePanFreq, 
  getAmbienceModFreq, 
  getAmbienceModDepth, 
  getAmbienceStereoGain
} from '../AudioMath';

export class AudioMixer {
  // Channels
  public masterGain!: GainNode;
  public sfxGain!: GainNode;
  public musicGain!: GainNode;
  public ambienceGain!: GainNode;

  // Ambience Graph (DSP)
  private ambiencePanner!: StereoPannerNode;
  private ambiencePanConstraint!: GainNode;
  private ambienceLFO!: OscillatorNode;
  private ambienceFilter!: BiquadFilterNode;
  private ambienceDepthLFO!: OscillatorNode;
  private ambienceDepthGain!: GainNode;

  private ctxManager: AudioContextManager;
  
  // State for Ducking
  private _targetMusicVol: number = 0;
  private _isMusicMuted: boolean = true;

  constructor(manager: AudioContextManager) {
    this.ctxManager = manager;
  }

  public init() {
    const ctx = this.ctxManager.ctx;
    if (!ctx) return;

    // 1. Create Channels
    this.masterGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.ambienceGain = ctx.createGain();

    // 2. Connect Basic Graph
    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    // 3. Build Ambience DSP Graph
    // Chain: Gain -> Filter -> Panner -> Master
    this.ambiencePanner = ctx.createStereoPanner();
    this.ambienceFilter = ctx.createBiquadFilter();

    // LFO for Panning (Movement)
    this.ambienceLFO = ctx.createOscillator();
    this.ambiencePanConstraint = ctx.createGain();
    
    // LFO for Filter (Texture)
    this.ambienceDepthLFO = ctx.createOscillator();
    this.ambienceDepthGain = ctx.createGain();

    // Ambience Routing
    this.ambienceGain.connect(this.ambienceFilter);
    this.ambienceFilter.connect(this.ambiencePanner); 
    this.ambiencePanner.connect(this.masterGain);

    // Modulation Routing
    this.ambienceLFO.type = 'sine';
    this.ambienceLFO.connect(this.ambiencePanConstraint);
    this.ambiencePanConstraint.connect(this.ambiencePanner.pan);

    this.ambienceFilter.type = 'lowpass';
    this.ambienceDepthLFO.type = 'sine';
    this.ambienceDepthLFO.connect(this.ambienceDepthGain);
    this.ambienceDepthGain.connect(this.ambienceFilter.frequency);

    // Start Generators
    this.ambienceLFO.start();
    this.ambienceDepthLFO.start();
  }

  public updateVolumes(settings: any) {
    if (!this.masterGain) return;

    // Calculate Music State
    this._isMusicMuted = !settings.music;
    this._targetMusicVol = this._isMusicMuted ? 0 : (settings.volumeMusic * 0.4);

    // Apply
    this.masterGain.gain.value = settings.master ? (settings.volumeMaster * 0.5) : 0;
    this.musicGain.gain.cancelScheduledValues(this.ctxManager.ctx!.currentTime);
    this.musicGain.gain.value = this._targetMusicVol;
    
    this.sfxGain.gain.value = settings.sfx ? (settings.volumeSfx * 0.8) : 0;
    
    // 1:1 Gain (Source Volume is now 0.24 in config)
    this.ambienceGain.gain.value = settings.ambience ? settings.volumeAmbience : 0.0;

    // Update DSP Params (Using Shared Math)
    const filter = settings.ambFilter ?? 0.5;
    const speed = settings.ambSpeed ?? 0.5;
    const width = settings.ambWidth ?? 0.5;
    const modSpeed = settings.ambModSpeed ?? 0.5;
    const modDepth = settings.ambModDepth ?? 0.5;

    this.ambienceFilter.frequency.value = getAmbienceFilterHz(filter);
    this.ambienceLFO.frequency.value = getAmbiencePanFreq(speed);
    this.ambiencePanConstraint.gain.value = getAmbienceStereoGain(width);
    this.ambienceDepthLFO.frequency.value = getAmbienceModFreq(modSpeed);
    this.ambienceDepthGain.gain.value = getAmbienceModDepth(modDepth);
  }

  public duckMusic(intensity: number, duration: number) {
    if (!this.musicGain || this._isMusicMuted) return;
    const ctx = this.ctxManager.ctx;
    if (!ctx) return;

    const baseVol = this._targetMusicVol;
    if (baseVol < 0.001) return;

    const now = ctx.currentTime;
    const targetVol = Math.max(0, baseVol * (1.0 - intensity));
    
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(targetVol, now + 0.05);
    this.musicGain.gain.exponentialRampToValueAtTime(baseVol, now + duration);
  }
}
