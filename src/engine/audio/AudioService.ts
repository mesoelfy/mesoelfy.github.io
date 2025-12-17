import { useStore } from '@/engine/state/global/useStore';
import { AUDIO_CONFIG } from '@/engine/config/AudioConfig';
import { IAudioService } from '@/engine/interfaces';
import { AudioContextManager } from './modules/AudioContextManager';
import { AudioSynthesizer } from './modules/AudioSynthesizer';
import { AudioMixer } from './modules/AudioMixer';
import { SoundBank } from './modules/SoundBank';

export class AudioServiceImpl implements IAudioService {
  private ctxManager = new AudioContextManager();
  private mixer = new AudioMixer(this.ctxManager);
  private bank = new SoundBank();
  public isReady = false;
  private hasInteracted = false; 
  private musicElement: HTMLAudioElement | null = null;
  private currentAmbienceNode: AudioBufferSourceNode | null = null;
  private currentAmbienceKey: string | null = null;

  public async init() {
    if (this.isReady) { this.ctxManager.resume(); return; }
    const ctx = this.ctxManager.init();
    if (!ctx) return;

    this.mixer.init();
    this.updateVolumes();
    await this.generateAllSounds();
    this.setupGlobalInteraction();
    this.isReady = true;
  }

  private async generateAllSounds() {
      const promises = Object.entries(AUDIO_CONFIG).map(([key, recipe]) => {
          return AudioSynthesizer.generate(recipe).then(buffer => {
              if (buffer) this.bank.add(key, buffer);
          });
      });
      await Promise.all(promises);
  }

  private setupGlobalInteraction() {
      const wakeUp = () => {
          if (this.hasInteracted) return;
          this.hasInteracted = true; 
          this.ctxManager.resume();
          if (!this.currentAmbienceKey) this.playAmbience('ambience_core');
          window.removeEventListener('pointerdown', wakeUp);
          window.removeEventListener('keydown', wakeUp);
      };
      window.addEventListener('pointerdown', wakeUp);
      window.addEventListener('keydown', wakeUp);
  }

  public updateVolumes() {
      this.mixer.updateVolumes(useStore.getState().audioSettings);
  }

  public playSound(key: string, pan: number = 0) {
      const ctx = this.ctxManager.ctx;
      const buffer = this.bank.get(key);
      const recipe = AUDIO_CONFIG[key];
      if (!ctx || !this.mixer.sfxGain || !buffer || !recipe) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      if (recipe.pitchVariance > 0) source.detune.value = (Math.random() * recipe.pitchVariance * 2) - recipe.pitchVariance;
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0));

      source.connect(panner);
      panner.connect(this.mixer.sfxGain);
      source.start();
  }

  public playAmbience(key: string) {
      const ctx = this.ctxManager.ctx;
      if (!ctx || !this.mixer.ambienceGain || (this.currentAmbienceKey === key && this.currentAmbienceNode)) return;

      if (this.currentAmbienceNode) {
          try { this.currentAmbienceNode.stop(ctx.currentTime + 0.5); } catch {}
          this.currentAmbienceNode = null;
      }
      const buffer = this.bank.get(key);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      const fadeGain = ctx.createGain();
      fadeGain.gain.setValueAtTime(0, ctx.currentTime);
      fadeGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 2.0); 
      source.connect(fadeGain); fadeGain.connect(this.mixer.ambienceGain); 
      source.start();
      this.currentAmbienceNode = source; this.currentAmbienceKey = key;
  }

  public startMusic() {
    this.ctxManager.resume();
    if (this.isReady) this.playAmbience('ambience_core');
    if (!this.musicElement) this.setupMusic();
    if (this.musicElement) { this.musicElement.currentTime = 0; this.musicElement.play().catch(() => {}); }
  }

  private setupMusic() {
    const ctx = this.ctxManager.ctx;
    if (!ctx || !this.mixer.musicGain || this.musicElement) return;
    this.musicElement = new Audio('/assets/audio/bg_music_placeholder.mp3');
    this.musicElement.loop = true; this.musicElement.crossOrigin = "anonymous";
    ctx.createMediaElementSource(this.musicElement).connect(this.mixer.musicGain);
  }
  
  public duckMusic(intensity: number, duration: number) { this.mixer.duckMusic(intensity, duration); }
  public getFrequencyData(array: Uint8Array) { this.mixer.getByteFrequencyData(array); }
  public stopAll() {
      if (this.musicElement) { this.musicElement.pause(); this.musicElement.currentTime = 0; }
      if (this.currentAmbienceNode) { try { this.currentAmbienceNode.stop(); } catch {} this.currentAmbienceNode = null; this.currentAmbienceKey = null; }
  }

  public playClick(pan: number = 0) { this.playSound('ui_click', pan); }
  public playHover(pan: number = 0) { this.playSound('ui_hover', pan); }
  public playBootSequence() { this.playSound('fx_boot_sequence'); } 
  public playDrillSound() { this.playSound('loop_drill'); }
  public playRebootZap() { this.playSound('loop_reboot'); }
}
