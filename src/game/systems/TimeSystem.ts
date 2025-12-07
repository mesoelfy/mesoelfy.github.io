import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { WorldConfig } from '../config/WorldConfig';

export class TimeSystem implements IGameSystem {
  public timeScale: number = 1.0;
  public elapsedTime: number = 0;
  public delta: number = 0;
  public isPaused: boolean = false;
  
  // FPS Counting
  public fps: number = 60;
  private frames: number = 0;
  private lastFpsTime: number = 0;
  
  private freezeTimer: number = 0;

  setup(locator: IServiceLocator): void {
    this.reset();
  }

  update(rawDelta: number, rawTime: number): void {
    // 1. Calculate FPS (Updates once per second)
    this.frames++;
    if (rawTime >= this.lastFpsTime + 1.0) {
        this.fps = this.frames;
        this.frames = 0;
        this.lastFpsTime = rawTime;
    }

    // 2. Handle Hit Stop (Freeze)
    if (this.freezeTimer > 0) {
        this.freezeTimer -= rawDelta;
        this.delta = 0; // Game logic pauses
        return;
    }

    if (this.isPaused) {
      this.delta = 0;
      return;
    }

    // 3. Normal Time Processing
    const safeDelta = Math.min(rawDelta, WorldConfig.time.maxDelta);
    this.delta = safeDelta * this.timeScale;
    this.elapsedTime += this.delta;
  }

  teardown(): void {
    this.reset();
  }

  private reset() {
    this.timeScale = 1.0;
    this.elapsedTime = 0;
    this.delta = 0;
    this.isPaused = false;
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
}
