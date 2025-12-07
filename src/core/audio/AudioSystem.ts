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

  public init() {
    if (this.isInitialized) {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return;
    }

    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (!this.ctx) return;

    // 1. Create Nodes
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.compressor = this.ctx.createDynamicsCompressor();

    // 2. Initial Volumes (Matches default Store State: Master 0.5, Music 0, SFX 0.8)
    this.masterGain.gain.value = 0.5;
    this.musicGain.gain.value = 0; // Default off
    this.sfxGain.gain.value = 0.8; 

    // 3. Wiring: Bus -> Compressor -> Master -> Out
    this.sfxGain.connect(this.compressor);
    this.musicGain.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // 4. Compressor Settings (Prevent clipping)
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.setupEventListeners();
    this.setupMusic();

    this.isInitialized = true;
    
    if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }
  }

  // --- BUS CONTROLS ---

  public setMasterMute(muted: boolean, instant = false) {
    if (!this.masterGain || !this.ctx) return;
    const val = muted ? 0 : 0.5;
    const t = this.ctx.currentTime;
    instant 
      ? (this.masterGain.gain.value = val) 
      : this.masterGain.gain.setTargetAtTime(val, t, 0.1);
  }

  public setMusicMute(muted: boolean, instant = false) {
    if (!this.musicGain || !this.ctx) return;
    const val = muted ? 0 : 0.4; // Music slightly quieter than SFX
    const t = this.ctx.currentTime;
    // Slower fade for music
    instant 
      ? (this.musicGain.gain.value = val) 
      : this.musicGain.gain.setTargetAtTime(val, t, 0.5);
  }

  public setSfxMute(muted: boolean, instant = false) {
    if (!this.sfxGain || !this.ctx) return;
    const val = muted ? 0 : 0.8;
    const t = this.ctx.currentTime;
    // Fast fade for SFX
    instant 
      ? (this.sfxGain.gain.value = val) 
      : this.sfxGain.gain.setTargetAtTime(val, t, 0.05);
  }

  // --- MUSIC SETUP ---

  private setupMusic() {
    if (!this.ctx || !this.musicGain) return;
    this.musicElement = new Audio('/assets/audio/bg_music_placeholder.mp3');
    this.musicElement.loop = true;
    this.musicElement.crossOrigin = "anonymous";
    this.musicSource = this.ctx.createMediaElementSource(this.musicElement);
    this.musicSource.connect(this.musicGain);
  }

  public startMusic() {
    if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
    }
    if (this.musicElement) this.musicElement.play().catch(e => console.warn(e));
  }

  // --- SFX LOGIC ---

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

  private playLaser() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);
    
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain); // Route to SFX Bus
    osc.start(t);
    osc.stop(t + 0.15);
  }

  private playHeal() {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.2);
      const gain = this.ctx.createGain();
      
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
  }

  private playExplosion(type: string) {
    if (!this.ctx || !this.sfxGain) return;
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
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  private playImpact(isPlayer: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private playDamageAlert() {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(200, t+0.05);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.03, t); 
      gain.gain.linearRampToValueAtTime(0, t+0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t+0.05);
  }

  private playMassiveExplosion() {
     this.playExplosion('kamikaze');
     if (this.ctx && this.masterGain) { // Connect bass rumble to master or sfx? SFX is better.
         const t = this.ctx.currentTime;
         const osc = this.ctx.createOscillator();
         osc.type = 'sine';
         osc.frequency.setValueAtTime(60, t);
         osc.frequency.exponentialRampToValueAtTime(10, t + 2.0);
         const gain = this.ctx.createGain();
         gain.gain.setValueAtTime(0.5, t);
         gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
         osc.connect(gain);
         gain.connect(this.sfxGain!);
         osc.start(t);
         osc.stop(t + 2.0);
     }
  }
  
  private playAlarm() {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
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
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain); // Use SFX Bus
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playClick() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain); // Use SFX Bus
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playBootSequence() { this.playAlarm(); }
}

export const AudioSystem = new AudioSystemController();
