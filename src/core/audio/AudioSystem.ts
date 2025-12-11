import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { useStore } from '@/core/store/useStore';
import { AUDIO_CONFIG } from '@/game/config/AudioConfig';

// Modules
import { AudioContextManager } from './modules/AudioContextManager';
import { AudioSynthesizer } from './modules/AudioSynthesizer';
import { AudioMixer } from './modules/AudioMixer';
import { SoundBank } from './modules/SoundBank';

class AudioSystemController {
  private ctxManager = new AudioContextManager();
  private mixer = new AudioMixer(this.ctxManager);
  private bank = new SoundBank();
  
  public isReady = false;
  private hasInteracted = false; 
  
  private musicElement: HTMLAudioElement | null = null;
  
  // Ambience State
  private currentAmbienceNode: AudioBufferSourceNode | null = null;
  private currentAmbienceKey: string | null = null;

  public async init() {
    if (this.isReady) {
        this.ctxManager.resume();
        return;
    }

    const ctx = this.ctxManager.init();
    if (!ctx) return;

    this.mixer.init();
    
    // Sync initial volumes
    this.updateVolumes();

    // Synthesis
    await this.generateAllSounds();
    
    this.setupEventListeners();
    this.setupGlobalInteraction();

    this.isReady = true;
    console.log('[AudioSystem] Modules Initialized & Ready.');
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
          
          if (!this.currentAmbienceKey) {
              this.playAmbience('ambience_core');
          }
          window.removeEventListener('pointerdown', wakeUp);
          window.removeEventListener('keydown', wakeUp);
      };
      window.addEventListener('pointerdown', wakeUp);
      window.addEventListener('keydown', wakeUp);
  }

  public updateVolumes() {
      const settings = useStore.getState().audioSettings;
      this.mixer.updateVolumes(settings);
  }

  public playSound(key: string) {
      const ctx = this.ctxManager.ctx;
      if (!ctx || !this.mixer.sfxGain) return;

      const buffer = this.bank.get(key);
      const recipe = AUDIO_CONFIG[key];
      
      if (!buffer || !recipe) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      if (recipe.pitchVariance > 0) {
          const detune = (Math.random() * recipe.pitchVariance * 2) - recipe.pitchVariance;
          source.detune.value = detune;
      }

      source.connect(this.mixer.sfxGain);
      source.start();
  }

  public playAmbience(key: string) {
      const ctx = this.ctxManager.ctx;
      if (!ctx || !this.mixer.ambienceGain) return;
      
      if (this.currentAmbienceKey === key && this.currentAmbienceNode) return;

      // Crossfade Out Old
      if (this.currentAmbienceNode) {
          const oldNode = this.currentAmbienceNode;
          try { oldNode.stop(ctx.currentTime + 0.5); } catch {}
          this.currentAmbienceNode = null;
      }

      const buffer = this.bank.get(key);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      // Crossfade In New (Local Gain for fade)
      const fadeGain = ctx.createGain();
      fadeGain.gain.setValueAtTime(0, ctx.currentTime);
      fadeGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 2.0); 

      source.connect(fadeGain);
      fadeGain.connect(this.mixer.ambienceGain); 
      source.start();
      
      this.currentAmbienceNode = source;
      this.currentAmbienceKey = key;
  }

  public startMusic() {
    this.ctxManager.resume();
    if (this.isReady) {
        this.playAmbience('ambience_core');
    }
    if (!this.musicElement) this.setupMusic();
    if (this.musicElement) this.musicElement.play().catch(() => {});
  }

  private setupMusic() {
    const ctx = this.ctxManager.ctx;
    if (!ctx || !this.mixer.musicGain || this.musicElement) return;
    
    this.musicElement = new Audio('/assets/audio/bg_music_placeholder.mp3');
    this.musicElement.loop = true;
    this.musicElement.crossOrigin = "anonymous";
    
    const source = ctx.createMediaElementSource(this.musicElement);
    source.connect(this.mixer.musicGain);
  }

  // --- EVENTS ---

  private setupEventListeners() {
    GameEventBus.subscribe(GameEvents.PLAYER_FIRED, () => this.playSound('fx_player_fire'));
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (p) => { 
        if (p.type === 'kamikaze') this.playSound('fx_impact_heavy');
        else this.playSound('fx_impact_light');
    });
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => {
        this.playSound('fx_impact_heavy'); 
        this.mixer.duckMusic(0.7, 1.0);
    });
    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        this.playSound('fx_impact_heavy');
        this.mixer.duckMusic(1.0, 3.0);
    });
    GameEventBus.subscribe(GameEvents.PANEL_HEALED, () => this.playSound('loop_heal'));
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, () => this.playSound('fx_level_up'));
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.playSound('fx_impact_heavy'); 
        this.mixer.duckMusic(0.8, 1.5);
    });
  }

  // --- ALIASES (Backward Compatibility) ---
  public playClick() { this.playSound('ui_click'); }
  public playHover() { this.playSound('ui_hover'); }
  public playBootSequence() { this.playSound('fx_boot_sequence'); } 
  public playDrillSound() { this.playSound('loop_drill'); }
  public playRebootZap() { this.playSound('loop_reboot'); }
}

export const AudioSystem = new AudioSystemController();
