export class AudioContextManager {
  private _ctx: AudioContext | null = null;

  public get ctx(): AudioContext | null {
    return this._ctx;
  }

  public init(): AudioContext | null {
    if (this._ctx) return this._ctx;
    
    if (typeof window === 'undefined') return null;

    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    this._ctx = new AudioContextClass();
    return this._ctx;
  }

  public async resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      try {
        await this._ctx.resume();
      } catch (e) {
        console.warn('[AudioContext] Resume failed:', e);
      }
    }
  }

  public get currentTime(): number {
    return this._ctx ? this._ctx.currentTime : 0;
  }
}
