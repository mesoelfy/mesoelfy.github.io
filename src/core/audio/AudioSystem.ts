import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { useStore } from '@/core/store/useStore';
import { AUDIO_CONFIG, SoundRecipe } from '@/game/config/AudioConfig';

class AudioSystemController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicElement: HTMLAudioElement | null = null;
  
  private buffers: Map<string, AudioBuffer> = new Map();
  public isReady = false;

  public async init() {
    if (this.isReady) {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return;
    }

    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();

    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.updateVolumes();

    await this.generateAllSounds();
    
    this.setupEventListeners();
    this.setupMusic();

    this.isReady = true;
    console.log('[AudioSystem] Synthesized and Ready.');
  }

  private updateVolumes() {
      if (!this.masterGain || !this.sfxGain || !this.musicGain) return;
      const s = useStore.getState().audioSettings;
      this.masterGain.gain.value = s.master ? 0.5 : 0;
      this.musicGain.gain.value = s.music ? 0.4 : 0;
      this.sfxGain.gain.value = s.sfx ? 0.8 : 0;
  }

  private async generateAllSounds() {
      const promises = Object.entries(AUDIO_CONFIG).map(([key, recipe]) => {
          return this.synthesizeSound(recipe).then(buffer => {
              if (buffer) this.buffers.set(key, buffer);
          });
      });
      await Promise.all(promises);
  }

  private makeDistortionCurve(amount: number) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private async synthesizeSound(recipe: SoundRecipe): Promise<AudioBuffer | null> {
      if (!this.ctx) return null;
      
      const sampleRate = 44100;
      const length = sampleRate * recipe.duration;
      const offline = new OfflineAudioContext(1, length, sampleRate);

      const mainGain = offline.createGain();
      mainGain.connect(offline.destination);
      
      const attack = recipe.attack || 0.005; 
      
      mainGain.gain.setValueAtTime(0, 0);
      mainGain.gain.linearRampToValueAtTime(recipe.volume, attack);
      mainGain.gain.exponentialRampToValueAtTime(0.01, recipe.duration);

      let outputNode: AudioNode = mainGain;

      if (recipe.distortion) {
          const shaper = offline.createWaveShaper();
          shaper.curve = this.makeDistortionCurve(recipe.distortion);
          shaper.connect(outputNode);
          outputNode = shaper; 
      }

      if (recipe.tremolo) {
          const tremoloNode = offline.createGain();
          tremoloNode.connect(outputNode);
          outputNode = tremoloNode;

          const lfo = offline.createOscillator();
          lfo.type = recipe.tremolo.wave || 'sine';
          lfo.frequency.value = recipe.tremolo.rate;
          
          const lfoGain = offline.createGain();
          lfoGain.gain.value = recipe.tremolo.depth; 
          
          tremoloNode.gain.value = 1.0 - (recipe.tremolo.depth / 2);
          lfo.connect(lfoGain);
          lfoGain.connect(tremoloNode.gain);
          
          lfo.start();
      }

      if (recipe.type === 'oscillator') {
          const osc = offline.createOscillator();
          osc.type = recipe.wave || 'sine';
          osc.frequency.setValueAtTime(recipe.frequency[0], 0);
          if (recipe.frequency[1] !== recipe.frequency[0]) {
              osc.frequency.exponentialRampToValueAtTime(recipe.frequency[1], recipe.duration);
          }

          if (recipe.fm) {
             const modOsc = offline.createOscillator();
             const modGain = offline.createGain();
             modOsc.type = recipe.fm.modType;
             modOsc.frequency.value = recipe.fm.modFreq;
             modGain.gain.value = recipe.fm.modIndex;
             modOsc.connect(modGain);
             modGain.connect(osc.frequency); 
             modOsc.start();
          }

          osc.connect(outputNode);
          osc.start();
      } 
      else if (recipe.type === 'noise') {
          const bufferSize = sampleRate * recipe.duration;
          const noiseBuffer = offline.createBuffer(1, bufferSize, sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
          }
          const noise = offline.createBufferSource();
          noise.buffer = noiseBuffer;

          if (recipe.filter) {
              const filter = offline.createBiquadFilter();
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(recipe.filter[0], 0);
              filter.frequency.exponentialRampToValueAtTime(recipe.filter[1], recipe.duration);
              noise.connect(filter);
              filter.connect(outputNode);
          } else {
              noise.connect(outputNode);
          }
          noise.start();
      }

      return await offline.startRendering();
  }

  public playSound(key: string) {
      if (!this.ctx || !this.sfxGain) return;
      
      const buffer = this.buffers.get(key);
      const recipe = AUDIO_CONFIG[key];
      
      if (!buffer || !recipe) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      
      if (recipe.pitchVariance > 0) {
          const detune = (Math.random() * recipe.pitchVariance * 2) - recipe.pitchVariance;
          source.detune.value = detune;
      }

      source.connect(this.sfxGain);
      source.start();
  }

  private setupEventListeners() {
    GameEventBus.subscribe(GameEvents.PLAYER_FIRED, () => this.playSound('laser'));
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (p) => { 
        if (p.type === 'kamikaze') this.playSound('explosion_large');
        else this.playSound('explosion_small');
    });
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => {
        this.playSound('explosion_large'); 
        this.duckMusic(0.7, 1.0);
    });
    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        this.playSound('explosion_large');
        this.duckMusic(1.0, 3.0);
    });
    
    // RESTORED: Play Healing Chime
    GameEventBus.subscribe(GameEvents.PANEL_HEALED, () => this.playSound('heal'));
    
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, () => this.playSound('powerup'));
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.playSound('explosion_large'); 
        this.duckMusic(0.8, 1.5);
    });
  }

  private duckMusic(intensity: number, duration: number) {
      if (!this.ctx || !this.musicGain) return;
      const settings = useStore.getState().audioSettings;
      if (!settings.music) return;
      
      const now = this.ctx.currentTime;
      const baseVol = 0.4;
      const targetVol = baseVol * (1.0 - intensity);
      
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(targetVol, now + 0.05);
      this.musicGain.gain.exponentialRampToValueAtTime(baseVol, now + duration);
  }

  public startMusic() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (!this.musicElement) this.setupMusic();
    if (this.musicElement) this.musicElement.play().catch(() => {});
  }

  private setupMusic() {
    if (!this.ctx || !this.musicGain || this.musicElement) return;
    this.musicElement = new Audio('/assets/audio/bg_music_placeholder.mp3');
    this.musicElement.loop = true;
    this.musicElement.crossOrigin = "anonymous";
    const source = this.ctx.createMediaElementSource(this.musicElement);
    source.connect(this.musicGain);
  }

  public playClick() { this.playSound('click'); }
  public playHover() { this.playSound('hover'); }
  public playBootSequence() { this.playSound('powerup'); } 
  public playDrillSound() { this.playSound('driller_drill'); }
  public playRebootZap() { this.playSound('reboot_tick'); }
  
  public setMasterMute(m: boolean) { 
      useStore.setState(s => ({ audioSettings: { ...s.audioSettings, master: !m } }));
      this.updateVolumes();
  }
  public setMusicMute(m: boolean) { 
      useStore.setState(s => ({ audioSettings: { ...s.audioSettings, music: !m } }));
      this.updateVolumes();
  }
  public setSfxMute(m: boolean) { 
      useStore.setState(s => ({ audioSettings: { ...s.audioSettings, sfx: !m } }));
      this.updateVolumes();
  }
}

export const AudioSystem = new AudioSystemController();
