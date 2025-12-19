import { useStore } from '@/engine/state/global/useStore';
import { AUDIO_MANIFEST } from '@/engine/config/assets/AudioManifest';
import { IAudioService } from '@/engine/interfaces';
import { AudioContextManager } from './modules/AudioContextManager';
import { AudioSynthesizer } from './modules/AudioSynthesizer';
import { AudioMixer } from './modules/AudioMixer';
import { SoundBank } from './modules/SoundBank';
import { VoiceManager } from './modules/VoiceManager';
import { AudioKey } from '@/engine/config/AssetKeys';

export class AudioServiceImpl implements IAudioService {
  private ctxManager = new AudioContextManager();
  private mixer = new AudioMixer(this.ctxManager);
  private bank = new SoundBank();
  private voices = new VoiceManager(this.ctxManager, this.bank, this.mixer);
  
  public isReady = false;
  private hasInteracted = false; 
  private _autoStartAmbience = false; // Queue flag

  public async init() {
    if (this.isReady) { this.ctxManager.resume(); return; }
    const ctx = this.ctxManager.init();
    if (!ctx) return;

    this.mixer.init();
    this.updateVolumes();
    
    // Async generation
    await this.generateAllSounds();
    
    this.setupGlobalInteraction();
    this.isReady = true;

    // Check queue
    if (this._autoStartAmbience) {
        this.playAmbience('ambience_core');
    }
  }

  private async generateAllSounds() {
      const promises = Object.entries(AUDIO_MANIFEST).map(([key, recipe]) => {
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
          // Ensure ambience is playing if we missed the auto-start due to suspension
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
      if (!this.isReady) return; // SFX needs buffers
      this.voices.playSFX(key, pan);
  }

  public playAmbience(key: AudioKey) {
      if (!this.isReady) return; // Ambience needs buffers
      this.voices.playAmbience(key);
  }

  public startMusic() {
    this.ctxManager.resume();
    
    // 1. Start Streaming Music (Does not require isReady/Buffers)
    this.voices.startMusic('/assets/audio/bg_music_placeholder.mp3');
    
    // 2. Queue Ambience (Requires Buffers)
    if (this.isReady) {
        this.playAmbience('ambience_core');
    } else {
        this._autoStartAmbience = true;
    }
  }
  
  public duckMusic(intensity: number, duration: number) { 
      this.mixer.duckMusic(intensity, duration); 
  }
  
  public getFrequencyData(array: Uint8Array) { 
      this.mixer.getByteFrequencyData(array); 
  }
  
  public stopAll() {
      this.voices.stopAll();
      this._autoStartAmbience = false;
  }

  public playClick(pan: number = 0) { this.playSound('ui_click', pan); }
  public playHover(pan: number = 0) { this.playSound('ui_hover', pan); }
  public playBootSequence() { this.playSound('fx_boot_sequence'); } 
  public playDrillSound() { this.playSound('loop_drill'); }
  public playRebootZap() { this.playSound('loop_reboot'); }
}
