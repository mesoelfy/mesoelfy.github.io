import { useStore } from '@/engine/state/global/useStore';
import { AUDIO_MANIFEST } from '@/engine/config/assets/AudioManifest';
import { IAudioService } from '@/engine/interfaces';
import { AudioContextManager } from './modules/AudioContextManager';
import { AudioSynthesizer } from './modules/AudioSynthesizer';
import { AudioMixer } from './modules/AudioMixer';
import { SoundBank } from './modules/SoundBank';
import { VoiceManager } from './modules/VoiceManager';
import { AudioKey } from '@/engine/config/AssetKeys';

const CRITICAL_SOUNDS: AudioKey[] = ['ui_click', 'ui_hover', 'ui_menu_open', 'ui_menu_close', 'fx_boot_sequence', 'ambience_core'];

export class AudioServiceImpl implements IAudioService {
  private ctxManager = new AudioContextManager();
  private mixer = new AudioMixer(this.ctxManager);
  private bank = new SoundBank();
  private voices = new VoiceManager(this.ctxManager, this.bank, this.mixer);
  public isReady = false;
  private hasInteracted = false; 
  private _autoStartAmbience = false; 
  private genQueue: AudioKey[] = [];
  private isGenerating = false;
  private pendingSounds: { key: AudioKey, pan: number }[] = [];

  public async init() {
    if (this.isReady) { this.ctxManager.resume(); return; }
    const ctx = this.ctxManager.init();
    if (!ctx) return;
    this.mixer.init();
    this.updateVolumes();
    await this.generateList(CRITICAL_SOUNDS);
    const allKeys = Object.keys(AUDIO_MANIFEST) as AudioKey[];
    this.genQueue = allKeys.filter(k => !this.bank.has(k));
    this.processQueue();
    this.setupGlobalInteraction();
    this.isReady = true;
    if (this.pendingSounds.length > 0) {
        this.pendingSounds.forEach(s => this.playSound(s.key, s.pan));
        this.pendingSounds = [];
    }
    if (this._autoStartAmbience) this.playAmbience('ambience_core');
  }

  private async generateList(keys: AudioKey[]) {
      await Promise.all(keys.map(key => this.generateSingle(key)));
  }

  private async generateSingle(key: AudioKey) {
      if (this.bank.has(key)) return;
      const recipe = AUDIO_MANIFEST[key];
      if (!recipe) return;
      const buffer = await AudioSynthesizer.generate(recipe);
      if (buffer) this.bank.add(key, buffer);
  }

  private processQueue() {
      if (this.genQueue.length === 0 || this.isGenerating) return;
      this.isGenerating = true;
      const nextKey = this.genQueue.shift();
      if (nextKey) {
          this.generateSingle(nextKey).then(() => {
              this.isGenerating = false;
              setTimeout(() => this.processQueue(), 10);
          });
      } else this.isGenerating = false;
  }

  private setupGlobalInteraction() {
      const wakeUp = () => {
          if (this.hasInteracted) return;
          this.hasInteracted = true; 
          this.ctxManager.resume();
          if (this.isReady) this.playAmbience('ambience_core');
          window.removeEventListener('pointerdown', wakeUp);
          window.removeEventListener('keydown', wakeUp);
      };
      window.addEventListener('pointerdown', wakeUp);
      window.addEventListener('keydown', wakeUp);
  }

  public updateVolumes() {
      this.mixer.updateVolumes(useStore.getState().audioSettings);
  }

  public playSound(key: AudioKey, pan: number = 0) {
      if (this.isReady) {
          if (this.bank.has(key)) this.voices.playSFX(key, pan);
      } else if (CRITICAL_SOUNDS.includes(key)) {
          this.pendingSounds.push({ key, pan });
      }
  }

  public playAmbience(key: AudioKey) {
      if (!this.isReady) return;
      if (this.bank.has(key)) this.voices.playAmbience(key);
      else this.generateSingle(key).then(() => this.voices.playAmbience(key));
  }

  public startMusic() {
    this.ctxManager.resume();
    this.voices.startMusic('/assets/audio/bg_music_placeholder.mp3');
    if (this.isReady && this.bank.has('ambience_core')) this.playAmbience('ambience_core');
    else this._autoStartAmbience = true;
  }
  
  public duckMusic(intensity: number, duration: number) { this.mixer.duckMusic(intensity, duration); }
  public getFrequencyData(array: Uint8Array) { this.mixer.getByteFrequencyData(array); }
  public stopAll() {
      this.voices.stopAll();
      this._autoStartAmbience = false;
      this.pendingSounds = [];
  }

  public playClick(pan: number = 0) { this.playSound('ui_click', pan); }
  public playHover(pan: number = 0) { this.playSound('ui_hover', pan); }
  public playBootSequence() { this.playSound('fx_boot_sequence'); } 
  public playDrillSound() { this.playSound('loop_drill'); }
  public playRebootZap() { this.playSound('loop_reboot'); }
}
