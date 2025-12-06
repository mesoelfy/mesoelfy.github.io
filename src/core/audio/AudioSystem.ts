import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

class AudioSystemController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicSource: MediaElementAudioSourceNode | null = null;
  private musicElement: HTMLAudioElement | null = null;
  private isInitialized = false;
  private isMuted = false;

  public async init() {
    if (this.isInitialized) return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8; 

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.6; 

    this.sfxGain.connect(this.compressor);
    this.musicGain.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.setupEventListeners();
    this.setupMusic();

    this.isInitialized = true;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  private setupMusic() {
    if (!this.ctx || !this.musicGain) return;
    this.musicElement = new Audio('/assets/audio/bg_music_placeholder.mp3');
    this.musicElement.loop = true;
    this.musicElement.crossOrigin = "anonymous";
    this.musicSource = this.ctx.createMediaElementSource(this.musicElement);
    this.musicSource.connect(this.musicGain);
  }

  public startMusic() {
    if (this.musicElement) this.musicElement.play().catch(e => console.warn(e));
  }

  private setupEventListeners() {
    GameEventBus.subscribe(GameEvents.PLAYER_FIRED, () => this.playLaser());
    GameEventBus.subscribe(GameEvents.PLAYER_HIT, () => this.playImpact(true));
    GameEventBus.subscribe(GameEvents.ENEMY_DESTROYED, (p) => this.playExplosion(p.type));
    GameEventBus.subscribe(GameEvents.PANEL_DAMAGED, () => this.playDamageAlert());
    GameEventBus.subscribe(GameEvents.PANEL_DESTROYED, () => this.playMassiveExplosion());
    GameEventBus.subscribe(GameEvents.PANEL_HEALED, () => this.playHeal());
    GameEventBus.subscribe(GameEvents.GAME_OVER, () => this.playGameOver());
    GameEventBus.subscribe(GameEvents.THREAT_LEVEL_UP, () => this.playAlarm());
    GameEventBus.subscribe(GameEvents.UPGRADE_SELECTED, () => this.playHeal());
  }

  // --- ADJUSTED VOLUMES ---

  private playLaser() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);
    
    // INCREASED: 0.1 -> 0.25
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  private playHeal() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.2);
      const gain = this.ctx.createGain();
      
      // DECREASED: 0.1 -> 0.05
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.2);
  }

  // ... (Rest unchanged)
  private playExplosion(type: string) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const isBig = type !== 'driller';
    const bufferSize = this.ctx.sampleRate * (isBig ? 0.8 : 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + (isBig ? 0.6 : 0.3));
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isBig ? 0.4 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isBig ? 0.6 : 0.3));
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(t);
  }

  private playImpact(isPlayer: boolean) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private playDamageAlert() {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(200, t+0.05);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.03, t); 
      gain.gain.linearRampToValueAtTime(0, t+0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t+0.05);
  }

  private playMassiveExplosion() {
     this.playExplosion('kamikaze');
     if (this.ctx) {
         const t = this.ctx.currentTime;
         const osc = this.ctx.createOscillator();
         osc.type = 'sine';
         osc.frequency.setValueAtTime(60, t);
         osc.frequency.exponentialRampToValueAtTime(10, t + 2.0);
         const gain = this.ctx.createGain();
         gain.gain.setValueAtTime(0.5, t);
         gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
         osc.connect(gain);
         gain.connect(this.masterGain!);
         osc.start(t);
         osc.stop(t + 2.0);
     }
  }
  
  private playAlarm() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.3);
  }

  private playGameOver() {
      this.playMassiveExplosion();
      if (this.musicSource && this.musicSource.playbackRate) {
          this.musicSource.playbackRate.value = 0.5;
      }
  }
  
  public playHover() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playClick() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playBootSequence() { this.playAlarm(); }
  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx!.currentTime, 0.1);
  }
}

export const AudioSystem = new AudioSystemController();
