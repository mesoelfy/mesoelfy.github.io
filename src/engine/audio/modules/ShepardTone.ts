export class ShepardTone {
  private ctx: AudioContext;
  private output: GainNode;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private isRunning = false;
  private volume: number = 0.3;
  private speed: number = 0.4; // Octaves per second
  private offset: number = 0;
  private animationFrame: number | null = null;

  private readonly NUM_OSC = 4;
  private readonly BASE_FREQ = 110; // A2
  private readonly FREQ_MAX = 8000;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.gain.value = 0;
    this.output.connect(destination);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.offset = 0;

    // Create Nodes
    for (let i = 0; i < this.NUM_OSC; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.output);
        
        osc.start();
        
        this.oscillators.push(osc);
        this.gains.push(gain);
    }

    // Ramp up volume
    this.output.gain.cancelScheduledValues(this.ctx.currentTime);
    this.output.gain.setValueAtTime(0, this.ctx.currentTime);
    this.output.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.5);

    this.tick();
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

    const now = this.ctx.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(this.output.gain.value, now);
    this.output.gain.linearRampToValueAtTime(0, now + 0.2);

    // Cleanup after fade
    setTimeout(() => {
        if (this.isRunning) return; // Restarted?
        this.oscillators.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
        this.gains.forEach(g => g.disconnect());
        this.oscillators = [];
        this.gains = [];
    }, 250);
  }

  private tick = () => {
    if (!this.isRunning) return;

    // Increment offset based on real time would be smoother, 
    // but simple increment works for visual/audio sync feel here.
    // 60fps assumption for "0.005" step.
    this.offset += this.speed * 0.01; 
    
    // Wrap offset (0 to NUM_OSC)
    // Actually standard shepard uses 0 to 1 wrapping per octave, mapped across oscillators
    
    for (let i = 0; i < this.NUM_OSC; i++) {
        // Calculate relative position (0.0 to 1.0) for this oscillator within the full range
        // Stagger them evenly
        let pos = (this.offset + i * (1 / this.NUM_OSC)) % 1.0;
        
        // Frequency moves exponentially from BASE to a higher octave range
        // Let's cover 4 octaves
        // f(x) = BASE * 2^(x * 4)
        const freq = this.BASE_FREQ * Math.pow(2, pos * 6); // 6 octaves range
        
        // Amplitude is a bell curve (Hanning window) to hide the wrap-around
        // sin(PI * x) is 0 at 0, 1 at 0.5, 0 at 1
        const gain = Math.sin(Math.PI * pos);
        
        // Apply (Smoothing prevents clicking)
        const now = this.ctx.currentTime;
        this.oscillators[i].frequency.setValueAtTime(freq, now);
        this.gains[i].gain.setValueAtTime(gain * 0.5, now); // 0.5 individual max to prevent clip
    }

    this.animationFrame = requestAnimationFrame(this.tick);
  }
}
