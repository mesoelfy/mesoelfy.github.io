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
  
  public isReady = false; // Public flag

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

    const settings = useStore.getState().audioSettings;
    this.masterGain.gain.value = settings.master ? 0.5 : 0;
    this.musicGain.gain.value = settings.music ? 0.4 : 0;
    this.sfxGain.gain.value = settings.sfx ? 0.8 : 0;

    // Await buffer generation
    await this.preRenderSounds();
    
    this.setupEventListeners();
    this.setupMusic();

    this.isReady = true;
  }

  private async preRenderSounds() {
      if (!this.ctx) return;
      const render = async (duration: number, fn: (t: number, ctx: OfflineAudioContext) => void) => {
          const sampleRate = 44100;
          const offline = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
          fn(duration, offline);
          return await offline.startRendering();
      };

      // Generate all buffers (Parallel)
      const p = [];
      
      p.push(render(0.15, (d, c) => {
          const osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(880, 0); osc.frequency.exponentialRampToValueAtTime(110, d);
          const g = c.createGain(); g.gain.setValueAtTime(0.2, 0); g.gain.exponentialRampToValueAtTime(0.01, d);
          osc.connect(g); g.connect(c.destination); osc.start();
      }).then(b => this.buffers.set('laser', b)));

      p.push(render(0.4, (d, c) => {
          const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate);
          const data = b.getChannelData(0); for(let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
          const n = c.createBufferSource(); n.buffer = b;
          const f = c.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(1000, 0); f.frequency.exponentialRampToValueAtTime(100, d);
          const g = c.createGain(); g.gain.setValueAtTime(0.3, 0); g.gain.exponentialRampToValueAtTime(0.01, d);
          n.connect(f); f.connect(g); g.connect(c.destination); n.start();
      }).then(b => this.buffers.set('explosion', b)));

      p.push(render(0.05, (d, c) => {
          const o = c.createOscillator(); o.type='square'; o.frequency.setValueAtTime(400,0);
          const g = c.createGain(); g.gain.setValueAtTime(0.1, 0); g.gain.exponentialRampToValueAtTime(0.01, d);
          o.connect(g); g.connect(c.destination); o.start();
      }).then(b => this.buffers.set('click', b)));

      p.push(render(0.2, (d, c) => {
          const o = c.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(300,0); o.frequency.linearRampToValueAtTime(600, d);
          const g = c.createGain(); g.gain.setValueAtTime(0.1, 0); g.gain.linearRampToValueAtTime(0, d);
          o.connect(g); g.connect(c.destination); o.start();
      }).then(b => this.buffers.set('heal', b)));

      p.push(render(1.5, (d, c) => {
          const o = c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(100,0); o.frequency.exponentialRampToValueAtTime(10, d);
          const g = c.createGain(); g.gain.setValueAtTime(0.5, 0); g.gain.exponentialRampToValueAtTime(0.01, d);
          o.connect(g); g.connect(c.destination); o.start();
      }).then(b => this.buffers.set('destruction', b)));

      await Promise.all(p);
  }

  // ... (Ducking Logic omitted for brevity, it's the same as previous step) ...
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
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, () => { this.playSound('explosion', Math.random() * 200 - 100); this.duckMusic(0.3, 0.5); });
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => { this.playSound('explosion', -500); this.duckMusic(0.7, 1.0); });
    GameEventBus.subscribe(GameEvents.GAME_OVER, () => { this.playSound('destruction', -200); this.duckMusic(1.0, 3.0); });
    GameEventBus.subscribe(GameEvents.PANEL_HEALED, () => this.playSound('heal'));
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, () => this.playSound('heal', 200));
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => { this.playSound('destruction', 0); this.duckMusic(0.8, 1.5); });
  }

  public playClick() { this.playSound('click'); }
  public playHover() { this.playSound('click', 500, 0.2); }
  public playBootSequence() { this.playSound('click'); } 
  public setMasterMute(m: boolean) { if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.5; }
  public setMusicMute(m: boolean) { if (this.musicGain) this.musicGain.gain.value = m ? 0 : 0.4; }
  public setSfxMute(m: boolean) { if (this.sfxGain) this.sfxGain.gain.value = m ? 0 : 0.8; }
}

export const AudioSystem = new AudioSystemController();
