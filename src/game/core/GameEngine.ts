import { IGameSystem, IServiceLocator } from './interfaces';
import { useGameStore } from '../store/useGameStore';
import { FXManager } from '../systems/FXManager';
import { ViewportHelper } from '../utils/ViewportHelper';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  private locator!: IServiceLocator;

  public get enemies() { return (this.locator.getSystem('EntitySystem') as any).enemies; }
  public get bullets() { return (this.locator.getSystem('EntitySystem') as any).bullets; }
  public get enemyBullets() { return (this.locator.getSystem('EntitySystem') as any).enemyBullets; }
  public get particles() { return (this.locator.getSystem('EntitySystem') as any).particles; }
  
  // Bridge for UI/Debug
  public get isRepairing() { 
    try {
      return (this.locator.getSystem('InteractionSystem') as any).repairState !== 'IDLE';
    } catch { return false; }
  }

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    FXManager.init();
  }

  public registerSystem(system: IGameSystem) {
    this.systems.push(system);
  }

  update(delta: number, time: number): void {
    const store = useGameStore.getState();
    
    if (store.isPlaying && store.systemIntegrity <= 0) {
        store.stopGame();
        FXManager.addTrauma(1.0);
        return;
    }

    for (const sys of this.systems) {
      sys.update(delta, time);
    }
  }

  teardown(): void {
    for (const sys of this.systems) {
      sys.teardown();
    }
    this.systems = [];
  }
  
  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    ViewportHelper.update(vpW, vpH, screenW, screenH);
  }
}
