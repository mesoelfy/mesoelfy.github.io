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

    // Wire them up: Panner -> Gain -> Destination (Mixer Bus)
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
    this._isBusy = true;
    
    // Cancel any previous automation to prevent glitches on rapid reuse
    const now = ctx.currentTime;
    this.panner.pan.cancelScheduledValues(now);
    this.panner.pan.setValueAtTime(pan, now);
    
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(volume, now);

    // Ephemeral Source (Web Audio API requires a new source node per playback)
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    if (pitchVariance > 0) {
        source.detune.value = (Math.random() * pitchVariance * 2) - pitchVariance;
    }

    // Connect to our persistent channel stack
    source.connect(this.panner);

    // Cleanup Logic
    source.onended = () => {
        source.disconnect();
        this._isBusy = false;
        this.currentSource = null;
        this.onRelease(this);
    };

    this.currentSource = source;
    source.start(now);
  }

  public stop() {
    if (this.currentSource) {
        try {
            this.currentSource.stop();
            this.currentSource.disconnect();
        } catch (e) {
            // Ignore if already stopped
        }
        this.currentSource = null;
    }
    this._isBusy = false;
    this.onRelease(this);
  }
}
