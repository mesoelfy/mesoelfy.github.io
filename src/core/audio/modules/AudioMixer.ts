import { AudioContextManager } from './AudioContextManager';

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
  private ambienceShaper!: WaveShaperNode; 

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
    // Chain: Gain -> Filter -> Shaper -> Panner -> Master
    this.ambiencePanner = ctx.createStereoPanner();
    this.ambienceFilter = ctx.createBiquadFilter();
    this.ambienceShaper = ctx.createWaveShaper();
    
    // Create Distortion Curve (Initialized flat)
    this.ambienceShaper.curve = this.makeDistortionCurve(0); 
    this.ambienceShaper.oversample = '2x';

    // LFO for Panning (Movement)
    this.ambienceLFO = ctx.createOscillator();
    this.ambiencePanConstraint = ctx.createGain();
    
    // LFO for Filter (Texture)
    this.ambienceDepthLFO = ctx.createOscillator();
    this.ambienceDepthGain = ctx.createGain();

    // Ambience Routing
    this.ambienceGain.connect(this.ambienceFilter);
    this.ambienceFilter.connect(this.ambienceShaper); 
    this.ambienceShaper.connect(this.ambiencePanner);
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
    
    // BOOST: 100% UI Volume = 300% Gain (3.0 multiplier)
    const AMBIENCE_BOOST = 3.0;
    this.ambienceGain.gain.value = settings.ambience ? (settings.volumeAmbience * AMBIENCE_BOOST) : 0.0;

    // Update DSP Params
    const filter = settings.ambFilter ?? 0.5;
    const speed = settings.ambSpeed ?? 0.5;
    const width = settings.ambWidth ?? 0.5;
    const modSpeed = settings.ambModSpeed ?? 0.5;
    const modDepth = settings.ambModDepth ?? 0.5;
    const grit = settings.ambGrit ?? 0.0;

    // --- RESTORED ORIGINAL MATH ---
    
    // 1. Filter (Density)
    // Original: 300 * 10^((x-0.5)*2)
    // Range: 30Hz to 3000Hz (at 0.5 = 300Hz)
    this.ambienceFilter.frequency.value = 300 * Math.pow(10, (filter - 0.5) * 2);

    // 2. Pan Speed (Circulation)
    // Original: 0.05 * 10^((x-0.5)*2)
    // Range: 0.005Hz to 0.5Hz (at 0.5 = 0.05Hz)
    this.ambienceLFO.frequency.value = 0.05 * Math.pow(10, (speed - 0.5) * 2);

    // 3. Stereo Width
    // Original: x^3 * 0.8
    this.ambiencePanConstraint.gain.value = Math.pow(width, 3) * 0.8;

    // 4. Mod Speed (Fluctuation)
    // Original: 0.2 * 10^((x-0.5)*2)
    // Range: 0.02Hz to 2.0Hz (at 0.5 = 0.2Hz)
    this.ambienceDepthLFO.frequency.value = 0.2 * Math.pow(10, (modSpeed - 0.5) * 2);

    // 5. Mod Depth (Instability)
    // Original: 10 * 10^((x-0.5)*2)
    // Range: 1Hz to 100Hz (at 0.5 = 10Hz)
    this.ambienceDepthGain.gain.value = 10 * Math.pow(10, (modDepth - 0.5) * 2);

    // 6. Grit (Distortion) - NEW
    if (Math.abs(grit) > 0.01) {
        const amount = grit * 400; // 0 to 400
        this.ambienceShaper.curve = this.makeDistortionCurve(amount);
    } else {
        this.ambienceShaper.curve = null;
    }
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

  private makeDistortionCurve(amount: number) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Classic sigmoid distortion
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
}
