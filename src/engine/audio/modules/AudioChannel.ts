export class AudioChannel {
  public readonly panner: StereoPannerNode;
  public readonly gain: GainNode;
  
  private _isBusy: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private onRelease: (channel: AudioChannel) => void;

  constructor(ctx: AudioContext, destination: AudioNode, onRelease: (c: AudioChannel) => void) {
    this.onRelease = onRelease;
    
    // Create persistent graph nodes
    this.panner = ctx.createStereoPanner();
    this.gain = ctx.createGain();

    // Wire them up: Panner -> Gain -> Destination (Mixer)
    this.panner.connect(this.gain);
    this.gain.connect(destination);
  }

  public get isBusy() { return this._isBusy; }

  public play(
    ctx: AudioContext, 
    buffer: AudioBuffer, 
    volume: number, 
    pan: number, 
    pitchVariance: number
  ) {
    // 1. Reset State
    this._isBusy = true;
    
    // 2. Configure Reusable Nodes
    // Smooth transitions to prevent clicking if reusing rapidly
    this.panner.pan.setValueAtTime(pan, ctx.currentTime);
    this.gain.gain.setValueAtTime(volume, ctx.currentTime);

    // 3. Create Ephemeral Source (Web Audio Requirement)
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    if (pitchVariance > 0) {
        source.detune.value = (Math.random() * pitchVariance * 2) - pitchVariance;
    }

    // 4. Connect to our persistent channel
    source.connect(this.panner);

    // 5. Cleanup Logic
    source.onended = () => {
        source.disconnect();
        this._isBusy = false;
        this.currentSource = null;
        this.onRelease(this);
    };

    this.currentSource = source;
    source.start();
  }

  public stop() {
    if (this.currentSource) {
        try {
            this.currentSource.stop();
            this.currentSource.disconnect();
        } catch (e) {
            // Ignore errors if already stopped
        }
        this.currentSource = null;
    }
    this._isBusy = false;
  }
}
