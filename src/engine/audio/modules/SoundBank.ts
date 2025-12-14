export class SoundBank {
  private buffers = new Map<string, AudioBuffer>();

  public add(key: string, buffer: AudioBuffer) {
    this.buffers.set(key, buffer);
  }

  public get(key: string): AudioBuffer | undefined {
    return this.buffers.get(key);
  }

  public has(key: string): boolean {
    return this.buffers.has(key);
  }
}
