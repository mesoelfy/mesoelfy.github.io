import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';
import { useStore } from '@/core/store/useStore';

class AudioSystemController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  private musicElement: HTMLAudioElement | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  
  private isInitialized = false;
  private lastDuckTime = 0;

  public init() {
    if (this.isInitialized) {
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

    const settings = useStore.getState().audioSettings;
    this.masterGain.gain.value = settings.master ? 0.5 : 0;
    this.musicGain.gain.value = settings.music ? 0.4 : 0;
    this.sfxGain.gain.value = settings.sfx ? 0.8 : 0;

    this.preRenderSounds();
    this.setupEventListeners();
    this.setupMusic();

    this.isInitialized = true;
  }

  // --- DUCKING LOGIC ---
  private duckMusic(intensity: number = 0.5, duration: number = 0.8) {
      if (!this.ctx || !this.musicGain) return;
      
      const settings = useStore.getState().audioSettings;
      if (!settings.music) return; // Don't duck if already muted

      const now = this.ctx.currentTime;
      
      // Prevent stuttering: Only re-trigger if enough time passed or priority is high
      if (now - this.lastDuckTime < 0.1) return;
      this.lastDuckTime = now;

      const baseVol = 0.4;
      const targetVol = baseVol * (1.0 - intensity);

      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      
      // Dip fast
      this.musicGain.gain.linearRampToValueAtTime(targetVol, now + 0.05);
      
      // Recover slow (exponential sounds more natural)
      this.musicGain.gain.exponentialRampToValueAtTime(baseVol, now + duration);
  }

  private async preRenderSounds() {
      if (!this.ctx) return;
      
      const render = async (duration: number, fn: (t: number, ctx: OfflineAudioContext) => void) => {
          const sampleRate = 44100;
          const offline = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
          fn(duration, offline);
          return await offline.startRendering();
      };

      this.buffers.set('laser', await render(0.15, (d, c) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, 0);
          osc.frequency.exponentialRampToValueAtTime(110, d);
          gain.gain.setValueAtTime(0.2, 0);
          gain.gain.exponentialRampToValueAtTime(0.01, d);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
      }));

      this.buffers.set('explosion', await render(0.4, (d, c) => {
          const bufferSize = c.sampleRate * d;
          const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = c.createBufferSource();
          noise.buffer = buffer;
          const filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1000, 0);
          filter.frequency.exponentialRampToValueAtTime(100, d);
          const gain = c.createGain();
          gain.gain.setValueAtTime(0.3, 0);
          gain.gain.exponentialRampToValueAtTime(0.01, d);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(c.destination);
          noise.start();
      }));

      this.buffers.set('click', await render(0.05, (d, c) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(400, 0);
          gain.gain.setValueAtTime(0.1, 0);
          gain.gain.exponentialRampToValueAtTime(0.01, d);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
      }));

      this.buffers.set('heal', await render(0.2, (d, c) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, 0);
          osc.frequency.linearRampToValueAtTime(600, d);
          gain.gain.setValueAtTime(0.1, 0);
          gain.gain.linearRampToValueAtTime(0, d);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
      }));

      this.buffers.set('destruction', await render(1.5, (d, c) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, 0);
          osc.frequency.exponentialRampToValueAtTime(10, d);
          gain.gain.setValueAtTime(0.5, 0);
          gain.gain.exponentialRampToValueAtTime(0.01, d);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
      }));
  }

  public playSound(key: string, detune = 0, volume = 1.0) {
      if (!this.ctx || !this.sfxGain) return;
      const buffer = this.buffers.get(key);
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.detune.value = detune;
      
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      
      source.connect(gain);
      gain.connect(this.sfxGain);
      source.start();
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

  private setupEventListeners() {
    GameEventBus.subscribe(GameEvents.PLAYER_FIRED, () => this.playSound('laser', Math.random() * 100));
    
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, () => {
        this.playSound('explosion', Math.random() * 200 - 100);
        // Slight ducking for enemy death
        this.duckMusic(0.3, 0.5); 
    });

    GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => {
        this.playSound('explosion', -500);
        // Heavy ducking for player hit
        this.duckMusic(0.7, 1.0);
    });

    GameEventBus.subscribe(GameEvents.GAME_OVER, () => {
        this.playSound('destruction', -200);
        this.duckMusic(1.0, 3.0); // Silence music briefly
    });
    
    GameEventBus.subscribe(GameEvents.PANEL_HEALED, () => this.playSound('heal'));
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, () => this.playSound('heal', 200));

    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => {
        this.playSound('destruction', 0);
        // Heavy ducking for panel destruction
        this.duckMusic(0.8, 1.5); 
    });
  }

  public playClick() { this.playSound('click'); }
  public playHover() { this.playSound('click', 500, 0.2); }
  public playBootSequence() { this.playSound('click'); } 
  
  public setMasterMute(m: boolean) { if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.5; }
  public setMusicMute(m: boolean) { if (this.musicGain) this.musicGain.gain.value = m ? 0 : 0.4; }
  public setSfxMute(m: boolean) { if (this.sfxGain) this.sfxGain.gain.value = m ? 0 : 0.8; }
}

export const AudioSystem = new AudioSystemController();
