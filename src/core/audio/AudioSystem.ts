import { useStore } from '@/core/store/useStore';

class AudioSystemController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  constructor() {
    // Singleton pattern could go here, but we'll manage instance via export
  }

  // 1. WAKE UP THE ENGINE (Must be called on user click)
  public async init() {
    if (this.isInitialized) return;

    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Master Volume
    this.masterGain = this.ctx!.createGain();
    this.masterGain.gain.value = 0.4; // Default volume
    this.masterGain.connect(this.ctx!.destination);

    this.isInitialized = true;
    
    // Resume context if suspended (browser policy)
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // 2. THE BOOT SOUND (THX Style Deep Drone)
  public playBootSequence() {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // OSC 1: Deep Bass (Sawtooth)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, t); // A1
    osc1.detune.setValueAtTime(-10, t); // Slight detune for thickness
    
    // Filter Sweep (Lowpass) - The "Opening" effect
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(0, t);
    filter.frequency.exponentialRampToValueAtTime(5000, t + 2.5); // Sweep up

    // Wiring 1
    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.masterGain);

    // Envelope 1
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.8, t + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 4);

    // OSC 2: Mid Harmony (Square)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(110, t); // A2
    osc2.detune.setValueAtTime(10, t);

    // Wiring 2
    osc2.connect(filter); // Share filter
    filter.connect(gain2);
    gain2.connect(this.masterGain);

    // Envelope 2
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.4, t + 0.5); // Enters slightly later
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 4);

    // GLITCH NOISE (Digital burst)
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Start
    osc1.start(t);
    osc2.start(t);
    noise.start(t);
    
    // Stop
    osc1.stop(t + 4.5);
    osc2.stop(t + 4.5);
  }

  // 3. HOVER SOUND (High-Tech Blip)
  public playHover() {
    if (!this.ctx || !this.masterGain || useStore.getState().musicEnabled === false) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Randomize pitch slightly for organic feel
    osc.frequency.setValueAtTime(800 + Math.random() * 200, t); 
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 4. CLICK SOUND (Mechanical Thud)
  public playClick() {
    if (!this.ctx || !this.masterGain || useStore.getState().musicEnabled === false) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1); // Pitch drop

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }
  
  // 5. TOGGLE MUTE
  public setMute(muted: boolean) {
      if (this.masterGain) {
          // If "muted" (musicEnabled = false), volume 0
          // If "unmuted" (musicEnabled = true), volume 0.4
          this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.4, this.ctx!.currentTime, 0.1);
      }
  }
}

export const AudioSystem = new AudioSystemController();
