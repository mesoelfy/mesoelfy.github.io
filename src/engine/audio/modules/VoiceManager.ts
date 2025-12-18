import { AudioContextManager } from './AudioContextManager';
import { SoundBank } from './SoundBank';
import { AudioMixer } from './AudioMixer';
import { AudioKey } from '@/engine/config/AssetKeys';
import { AUDIO_MANIFEST } from '@/engine/config/assets/AudioManifest';

const MAX_POLYPHONY = 100;

export class VoiceManager {
  private activeCount = 0;
  private currentAmbienceNode: AudioBufferSourceNode | null = null;
  private currentAmbienceGain: GainNode | null = null; 
  private currentAmbienceKey: string | null = null;
  private musicElement: HTMLAudioElement | null = null;

  constructor(
    private ctxManager: AudioContextManager,
    private bank: SoundBank,
    private mixer: AudioMixer
  ) {}

  public playSFX(key: AudioKey, pan: number = 0) {
    if (this.activeCount >= MAX_POLYPHONY) return;

    const ctx = this.ctxManager.ctx;
    const buffer = this.bank.get(key);
    const recipe = AUDIO_MANIFEST[key];
    
    if (!ctx || !this.mixer.sfxGain || !buffer || !recipe) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    if (recipe.pitchVariance > 0) {
        source.detune.value = (Math.random() * recipe.pitchVariance * 2) - recipe.pitchVariance;
    }

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0));

    source.connect(panner);
    panner.connect(this.mixer.sfxGain);

    source.onended = () => {
        this.activeCount--;
    };
    
    this.activeCount++;
    source.start();
  }

  public playAmbience(key: AudioKey) {
    const ctx = this.ctxManager.ctx;
    if (!ctx || !this.mixer.ambienceGain) return;
    
    if (this.currentAmbienceKey === key && this.currentAmbienceNode) return;

    if (this.currentAmbienceNode && this.currentAmbienceGain) {
        const oldGain = this.currentAmbienceGain;
        const oldNode = this.currentAmbienceNode;
        try {
            oldGain.gain.cancelScheduledValues(ctx.currentTime);
            oldGain.gain.setValueAtTime(oldGain.gain.value, ctx.currentTime);
            oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
            oldNode.stop(ctx.currentTime + 1.1);
        } catch {}
    }

    const buffer = this.bank.get(key);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer; 
    source.loop = true;
    
    const fadeGain = ctx.createGain();
    fadeGain.gain.setValueAtTime(0, ctx.currentTime);
    fadeGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 2.0); 
    
    source.connect(fadeGain); 
    fadeGain.connect(this.mixer.ambienceGain); 
    source.start();
    
    this.currentAmbienceNode = source; 
    this.currentAmbienceGain = fadeGain; 
    this.currentAmbienceKey = key;
  }

  public startMusic(url: string) {
    const ctx = this.ctxManager.ctx;
    if (!ctx || !this.mixer.musicGain || this.musicElement) return;

    this.musicElement = new Audio(url);
    this.musicElement.loop = true; 
    this.musicElement.crossOrigin = "anonymous";
    
    const source = ctx.createMediaElementSource(this.musicElement);
    source.connect(this.mixer.musicGain);
    
    this.musicElement.play().catch(() => console.warn("[Audio] Autoplay blocked"));
  }

  public stopAll() {
    if (this.musicElement) { 
        this.musicElement.pause(); 
        this.musicElement.currentTime = 0; 
    }
    
    if (this.currentAmbienceNode) { 
        try { this.currentAmbienceNode.stop(); } catch {} 
        this.currentAmbienceNode = null; 
        this.currentAmbienceGain = null;
        this.currentAmbienceKey = null; 
    }
    
    this.activeCount = 0;
  }
}
