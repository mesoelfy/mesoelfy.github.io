import { AudioContextManager } from './AudioContextManager';
import { getAmbienceFilterHz, getAmbiencePanFreq, getAmbienceModFreq, getAmbienceModDepth, getAmbienceStereoGain, generateImpulseResponse } from '../AudioMath';

export class AudioMixer {
  public masterGain!: GainNode;
  public sfxGain!: GainNode;
  public musicGain!: GainNode;
  public ambienceGain!: GainNode;
  public compressor!: DynamicsCompressorNode;
  public analyser!: AnalyserNode;
  private musicFilter!: BiquadFilterNode;
  private masterFilter!: BiquadFilterNode;
  private reverbNode!: ConvolverNode;
  private reverbSend!: GainNode;
  private delayNode!: DelayNode;
  private delayFeedback!: GainNode;
  private delaySend!: GainNode;
  private ambiencePanner!: StereoPannerNode;
  private ambiencePanConstraint!: GainNode;
  private ambienceLFO!: OscillatorNode;
  private ambienceFilter!: BiquadFilterNode;
  private ambienceDepthLFO!: OscillatorNode;
  private ambienceDepthGain!: GainNode;
  private ctxManager: AudioContextManager;
  private _targetMusicVol: number = 0;
  private _isMusicMuted: boolean = true;
  private readonly MAX_FREQ = 20000;
  private readonly MIN_FREQ = 350;

  constructor(manager: AudioContextManager) { this.ctxManager = manager; }

  public init() {
    const ctx = this.ctxManager.ctx;
    if (!ctx) return;
    this.masterGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.ambienceGain = ctx.createGain();
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = this.MAX_FREQ;
    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = this.MAX_FREQ;
    this.compressor = ctx.createDynamicsCompressor();
    this.analyser = ctx.createAnalyser();
    this.compressor.threshold.value = -12; 
    this.compressor.knee.value = 30;       
    this.compressor.ratio.value = 12; 
    this.compressor.attack.value = 0.003;  
    this.compressor.release.value = 0.25; 
    this.analyser.fftSize = 64; 
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = generateImpulseResponse(ctx, 1.5, 2.0);
    this.reverbSend = ctx.createGain(); 
    this.delayNode = ctx.createDelay(1.0);
    this.delayFeedback = ctx.createGain();
    this.delaySend = ctx.createGain(); 
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.masterGain);
    this.reverbNode.connect(this.masterGain);
    this.musicGain.connect(this.musicFilter);
    this.musicFilter.connect(this.masterFilter);
    this.sfxGain.connect(this.masterFilter);
    this.sfxGain.connect(this.reverbSend);
    this.sfxGain.connect(this.delaySend);
    this.reverbSend.connect(this.reverbNode);
    this.delaySend.connect(this.delayNode);
    this.masterFilter.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.ambiencePanner = ctx.createStereoPanner();
    this.ambienceFilter = ctx.createBiquadFilter();
    this.ambienceLFO = ctx.createOscillator();
    this.ambiencePanConstraint = ctx.createGain();
    this.ambienceDepthLFO = ctx.createOscillator();
    this.ambienceDepthGain = ctx.createGain();
    this.ambienceGain.connect(this.ambienceFilter);
    this.ambienceFilter.connect(this.ambiencePanner); 
    this.ambiencePanner.connect(this.masterFilter); 
    this.ambienceLFO.connect(this.ambiencePanConstraint);
    this.ambiencePanConstraint.connect(this.ambiencePanner.pan);
    this.ambienceDepthLFO.connect(this.ambienceDepthGain);
    this.ambienceDepthGain.connect(this.ambienceFilter.frequency);
    this.ambienceLFO.start(); this.ambienceDepthLFO.start();
  }

  public updateVolumes(settings: any) {
    if (!this.masterGain) return;
    this._isMusicMuted = !settings.music;
    this._targetMusicVol = this._isMusicMuted ? 0 : (settings.volumeMusic * 0.4);
    this.masterGain.gain.value = settings.master ? (settings.volumeMaster * 0.5) : 0;
    this.musicGain.gain.value = this._targetMusicVol;
    this.sfxGain.gain.value = settings.sfx ? (settings.volumeSfx * 0.8) : 0;
    this.ambienceGain.gain.value = settings.ambience ? settings.volumeAmbience : 0.0;
    this.ambienceFilter.frequency.value = getAmbienceFilterHz(settings.ambFilter ?? 0.5);
    this.ambienceLFO.frequency.value = getAmbiencePanFreq(settings.ambSpeed ?? 0.5);
    this.ambiencePanConstraint.gain.value = getAmbienceStereoGain(settings.ambWidth ?? 0.5);
    this.ambienceDepthLFO.frequency.value = getAmbienceModFreq(settings.ambModSpeed ?? 0.5);
    this.ambienceDepthGain.gain.value = getAmbienceModDepth(settings.ambModDepth ?? 0.5);
    this.reverbSend.gain.value = settings.fxReverbMix ?? 0.2;
    this.delaySend.gain.value = settings.fxDelayMix ?? 0.1;
    this.delayNode.delayTime.value = 0.1 + ((settings.fxDelayTime ?? 0.25) * 0.9);
    this.delayFeedback.gain.value = settings.fxDelayFeedback ?? 0.3;
  }

  public duckMusic(intensity: number, duration: number) {
    if (!this.musicFilter || this._isMusicMuted) return;
    const ctx = this.ctxManager.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const targetFreq = this.MAX_FREQ * Math.pow(this.MIN_FREQ / this.MAX_FREQ, intensity);
    this.musicFilter.frequency.cancelScheduledValues(now);
    this.musicFilter.frequency.setValueAtTime(this.musicFilter.frequency.value, now);
    this.musicFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.04);
    this.musicFilter.frequency.exponentialRampToValueAtTime(this.MAX_FREQ, now + duration);
  }

  /**
   * Updates the global low-pass filter based on system integrity.
   * @param integrity 0.0 (Destroyed) to 1.0 (Healthy)
   * @param transitionTime How fast to reach target frequency (seconds)
   */
  public updateMasterFilter(integrity: number, transitionTime: number = 0.05) {
      if (!this.masterFilter) return;
      const ctx = this.ctxManager.ctx;
      
      // THRESHOLD SET TO 60% (Matching UI Yellow State)
      const THRESHOLD = 0.6;
      const FLOOR_FREQ = 800; // Muffled but audible
      
      // If healthy or missing context, open filter
      if (!ctx || integrity >= 1.0) {
          this.masterFilter.frequency.setTargetAtTime(this.MAX_FREQ, ctx?.currentTime || 0, transitionTime);
          return;
      }

      // If integrity is above the warning threshold (Green), keep open
      if (integrity > THRESHOLD) {
          this.masterFilter.frequency.setTargetAtTime(this.MAX_FREQ, ctx.currentTime, 0.1);
          return;
      }

      // Logic:
      // We are below 60%.
      // We normalize the remaining health within this danger zone (0% to 60%).
      const ratio = integrity / THRESHOLD;
      
      // Quadratic Curve: This makes the filter close faster than a linear slide.
      // At 60% (Start): ratio=1.0, curve=1.0, intensity=0 (Open)
      // At 30% (Critical): ratio=0.5, curve=0.25, intensity=0.75 (Heavily Muffled)
      const curve = ratio * ratio; 
      
      const intensity = 1.0 - curve; 

      const targetFreq = this.MAX_FREQ * Math.pow(FLOOR_FREQ / this.MAX_FREQ, intensity);
      this.masterFilter.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
  }

  public getByteFrequencyData(array: Uint8Array) { if (this.analyser) this.analyser.getByteFrequencyData(array); }
}
