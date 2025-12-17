import { AudioContextManager } from './AudioContextManager';
import { 
  getAmbienceFilterHz, getAmbiencePanFreq, getAmbienceModFreq, 
  getAmbienceModDepth, getAmbienceStereoGain, generateImpulseResponse
} from '../AudioMath';

export class AudioMixer {
  public masterGain!: GainNode;
  public sfxGain!: GainNode;
  public musicGain!: GainNode;
  public ambienceGain!: GainNode;
  public compressor!: DynamicsCompressorNode;
  public analyser!: AnalyserNode;

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

  constructor(manager: AudioContextManager) {
    this.ctxManager = manager;
  }

  public init() {
    const ctx = this.ctxManager.ctx;
    if (!ctx) return;

    this.masterGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.ambienceGain = ctx.createGain();
    this.compressor = ctx.createDynamicsCompressor();
    this.analyser = ctx.createAnalyser();

    this.compressor.threshold.value = -12; this.compressor.knee.value = 30;       
    this.compressor.ratio.value = 12; this.compressor.attack.value = 0.003;  
    this.compressor.release.value = 0.25; this.analyser.fftSize = 64; 
    this.analyser.smoothingTimeConstant = 0.8;

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

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.sfxGain.connect(this.reverbSend);
    this.sfxGain.connect(this.delaySend);
    this.reverbSend.connect(this.reverbNode);
    this.delaySend.connect(this.delayNode);
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
    this.ambiencePanner.connect(this.masterGain);
    this.ambienceLFO.type = 'sine';
    this.ambienceLFO.connect(this.ambiencePanConstraint);
    this.ambiencePanConstraint.connect(this.ambiencePanner.pan);
    this.ambienceFilter.type = 'lowpass';
    this.ambienceDepthLFO.type = 'sine';
    this.ambienceDepthLFO.connect(this.ambienceDepthGain);
    this.ambienceDepthGain.connect(this.ambienceFilter.frequency);
    this.ambienceLFO.start(); this.ambienceDepthLFO.start();
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

    this.ambienceFilter.frequency.value = getAmbienceFilterHz(settings.ambFilter ?? 0.5);
    this.ambienceLFO.frequency.value = getAmbiencePanFreq(settings.ambSpeed ?? 0.5);
    this.ambiencePanConstraint.gain.value = getAmbienceStereoGain(settings.ambWidth ?? 0.5);
    this.ambienceDepthLFO.frequency.value = getAmbienceModFreq(settings.ambModSpeed ?? 0.5);
    this.ambienceDepthGain.gain.value = getAmbienceModDepth(settings.ambModDepth ?? 0.5);

    if (this.reverbSend) {
        this.reverbSend.gain.value = settings.fxReverbMix ?? 0.2;
        this.delaySend.gain.value = settings.fxDelayMix ?? 0.1;
        this.delayNode.delayTime.value = 0.1 + ((Number.isFinite(settings.fxDelayTime) ? settings.fxDelayTime : 0.25) * 0.9);
        this.delayFeedback.gain.value = settings.fxDelayFeedback ?? 0.3;
    }
  }

  public duckMusic(intensity: number, duration: number) {
    if (!this.musicGain || this._isMusicMuted) return;
    const ctx = this.ctxManager.ctx;
    const baseVol = this._targetMusicVol;
    if (!ctx || baseVol < 0.001) return;
    const now = ctx.currentTime;
    const targetVol = Math.max(0, baseVol * (1.0 - intensity));
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(targetVol, now + 0.05);
    this.musicGain.gain.exponentialRampToValueAtTime(baseVol, now + duration);
  }
  
  public getByteFrequencyData(array: Uint8Array) { if (this.analyser) this.analyser.getByteFrequencyData(array); }
}
