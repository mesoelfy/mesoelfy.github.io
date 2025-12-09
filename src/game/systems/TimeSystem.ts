import { IGameSystem, IServiceLocator } from '../core/interfaces';

export class TimeSystem implements IGameSystem {
  public timeScale: number = 1.0;
  public elapsedTime: number = 0;
  
  // Hit Stop / Freeze logic
  private freezeTimer: number = 0;

  // FPS Counting (Visual only)
  public fps: number = 60;
  private frames: number = 0;
  private lastFpsTime: number = 0;

  setup(locator: IServiceLocator): void {
    this.reset();
  }

  update(delta: number, time: number): void {
    // This 'delta' is now the FIXED TIMESTEP (0.0166) coming from GameEngine
    
    // 1. Track Simulation Time
    this.elapsedTime += delta;

    // 2. Decrement Freeze Timer (Hit Stop)
    if (this.freezeTimer > 0) {
        this.freezeTimer -= delta;
    }

    // 3. FPS Calculation (Approximate based on calls per second)
    // Actually, update() is called multiple times per frame now. 
    // We should probably rely on the GameEngine's render loop for FPS, 
    // but for simplicity, we'll increment a counter here.
    // If the loop runs 60 times a second, this will show 60.
    // If it spirals, it might show 120.
    
    // Better Approach: Use performance.now() to check real time for FPS
    const now = performance.now() / 1000;
    this.frames++;
    if (now >= this.lastFpsTime + 1.0) {
        this.fps = this.frames; // This will effectively show TPS (Ticks Per Second)
        this.frames = 0;
        this.lastFpsTime = now;
    }
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
