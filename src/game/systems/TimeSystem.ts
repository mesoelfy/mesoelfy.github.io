import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { WorldConfig } from '../config/WorldConfig';

export class TimeSystem implements IGameSystem {
  public timeScale: number = 1.0;
  public elapsedTime: number = 0;
  public delta: number = 0;
  public isPaused: boolean = false;

  setup(locator: IServiceLocator): void {
    this.reset();
  }

  update(rawDelta: number, rawTime: number): void {
    if (this.isPaused) {
      this.delta = 0;
      return;
    }

    // Clamp delta to prevent huge jumps
    const safeDelta = Math.min(rawDelta, WorldConfig.time.maxDelta);
    
    // Apply Time Scale (Slow-mo / Hit-stop)
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
  }
  
  public setScale(scale: number, duration?: number) {
    this.timeScale = scale;
    if (duration) {
      setTimeout(() => {
        this.timeScale = 1.0;
      }, duration * 1000);
    }
  }
}
