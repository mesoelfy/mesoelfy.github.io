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
    // VOLUME REDUCED: 0.4 -> 0.25 to blend better with SFX
    this._targetMusicVol = this._isMusicMuted ? 0 : (settings.volumeMusic * 0.25);
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

  public updateMasterFilter(integrity: number, transitionTime: number = 0.05) {
      if (!this.masterFilter) return;
      const ctx = this.ctxManager.ctx;
      
      const YELLOW_START = 0.6; 
      const RED_START = 0.3;    
      const FLOOR_FREQ = 700;   
      const RED_BOUNDARY_INTENSITY = 0.6; 

      let intensity = 0;

      if (!ctx || integrity >= 1.0) {
          intensity = 0;
      } else if (integrity > YELLOW_START) {
          intensity = 0;
      } else if (integrity > RED_START) {
          const range = YELLOW_START - RED_START; 
          const t = (YELLOW_START - integrity) / range; 
          intensity = (t * t) * RED_BOUNDARY_INTENSITY;
      } else {
          const range = RED_START - 0.0;
          const t = (RED_START - integrity) / range; 
          intensity = RED_BOUNDARY_INTENSITY + (t * (1.0 - RED_BOUNDARY_INTENSITY));
      }

      const targetFreq = this.MAX_FREQ * Math.pow(FLOOR_FREQ / this.MAX_FREQ, intensity);
      this.masterFilter.frequency.setTargetAtTime(targetFreq, ctx ? ctx.currentTime : 0, transitionTime);
  }

  public getByteFrequencyData(array: Uint8Array) { if (this.analyser) this.analyser.getByteFrequencyData(array); }
}
