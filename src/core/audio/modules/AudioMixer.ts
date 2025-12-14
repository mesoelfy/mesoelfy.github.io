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

  // Mastering Chain
  public compressor!: DynamicsCompressorNode;
  public analyser!: AnalyserNode;

  // Ambience Graph (DSP)
  private ambiencePanner!: StereoPannerNode;
  private ambiencePanConstraint!: GainNode;
  private ambienceLFO!: OscillatorNode;
  private ambienceFilter!: BiquadFilterNode;
  private ambienceDepthLFO!: OscillatorNode;
  private ambienceDepthGain!: GainNode;

  private ctxManager: AudioContextManager;
  
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

    // 2. Create Mastering Nodes
    this.compressor = ctx.createDynamicsCompressor();
    this.analyser = ctx.createAnalyser();

    // 3. Configure Mastering
    // Compressor: "Limiter" style to catch loud explosions
    this.compressor.threshold.value = -12; // Start compressing at -12dB
    this.compressor.knee.value = 30;       // Soft knee
    this.compressor.ratio.value = 12;      // High ratio (limit)
    this.compressor.attack.value = 0.003;  // Fast attack
    this.compressor.release.value = 0.25;  // Quick release

    // Analyser: For Visuals
    this.analyser.fftSize = 64; // Low res is fine for UI bars (32 bins)
    this.analyser.smoothingTimeConstant = 0.8;

    // 4. Connect Graph
    // Sources -> Master Gain -> Compressor -> Analyser -> Destination
    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // 5. Build Ambience DSP Graph
    this.ambiencePanner = ctx.createStereoPanner();
    this.ambienceFilter = ctx.createBiquadFilter();
    this.ambienceLFO = ctx.createOscillator();
    this.ambiencePanConstraint = ctx.createGain();
    this.ambienceDepthLFO = ctx.createOscillator();
    this.ambienceDepthGain = ctx.createGain();

    // Ambience Routing (Joins Master at the end)
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

    this.ambienceLFO.start();
    this.ambienceDepthLFO.start();
  }

  public updateVolumes(settings: any) {
    if (!this.masterGain) return;

    this._isMusicMuted = !settings.music;
    this._targetMusicVol = this._isMusicMuted ? 0 : (settings.volumeMusic * 0.4);

    this.masterGain.gain.value = settings.master ? (settings.volumeMaster * 0.5) : 0;
    this.musicGain.gain.cancelScheduledValues(this.ctxManager.ctx!.currentTime);
    this.musicGain.gain.value = this._targetMusicVol;
    
    this.sfxGain.gain.value = settings.sfx ? (settings.volumeSfx * 0.8) : 0;
    this.ambienceGain.gain.value = settings.ambience ? settings.volumeAmbience : 0.0;

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
  
  // NEW: Accessor for Visualizer
  public getByteFrequencyData(array: Uint8Array) {
      if (this.analyser) {
          this.analyser.getByteFrequencyData(array);
      }
  }
}
