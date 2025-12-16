import { IGameSystem } from '@/core/interfaces';

export class TimeSystem implements IGameSystem {
  public timeScale: number = 1.0;
  public elapsedTime: number = 0; // Game World Time
  
  private freezeTimer: number = 0; // Real World Time duration

  // FPS Counting
  public fps: number = 60;
  private frames: number = 0;
  private lastFpsTime: number = 0;

  constructor() {
    this.reset();
  }

  // Called by GameEngine every render frame (Variable Interval)
  public tickRealTime(dt: number) {
      // 1. Handle Freeze Timer (Real Time)
      if (this.freezeTimer > 0) {
          this.freezeTimer -= dt;
          if (this.freezeTimer < 0) this.freezeTimer = 0;
      }

      // 2. FPS Calculation (Real Time)
      const now = performance.now() / 1000;
      this.frames++;
      if (now >= this.lastFpsTime + 1.0) {
          this.fps = this.frames;
          this.frames = 0;
          this.lastFpsTime = now;
      }
  }

  // Called by GameEngine only during simulation steps (Fixed Interval)
  update(delta: number, time: number): void {
    // This delta is always 0.0166 (Fixed Step)
    this.elapsedTime += delta;
  }

  teardown(): void {
    this.reset();
  }

  private reset() {
    this.timeScale = 1.0;
    this.elapsedTime = 0;
    this.freezeTimer = 0;
    this.frames = 0;
    this.lastFpsTime = 0;
    this.fps = 60;
  }
  
  public setScale(scale: number, duration?: number) {
    this.timeScale = scale;
    if (duration) {
      setTimeout(() => {
        this.timeScale = 1.0;
      }, duration * 1000);
    }
  }

  public freeze(duration: number) {
      this.freezeTimer = duration;
  }

  public isFrozen(): boolean {
      return this.freezeTimer > 0;
  }
}
