import { IGameSystem, IServiceLocator } from './interfaces';
import { useGameStore } from '../store/useGameStore';
import { FXManager } from '../systems/FXManager';
import { ViewportHelper } from '../utils/ViewportHelper';
import { Registry } from './ecs/EntityRegistry';
import { Tag } from './ecs/types';
import { PanelRegistrySystem } from '../systems/PanelRegistrySystem'; // NEW IMPORT

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  private locator!: IServiceLocator;

  // Bridge getters to Registry
  public get enemies() { return Registry.getByTag(Tag.ENEMY); }
  public get bullets() { return Registry.getByTag(Tag.BULLET).filter(b => !b.hasTag(Tag.ENEMY)); }
  public get enemyBullets() { return Registry.getByTag(Tag.BULLET).filter(b => b.hasTag(Tag.ENEMY)); }
  public get particles() { return Registry.getByTag(Tag.PARTICLE); }
  
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
    // 1. Update the Math Helper
    ViewportHelper.update(vpW, vpH, screenW, screenH);
    
    // 2. CRITICAL FIX: Tell the Registry to recalculate all DOM positions 
    // now that we know the real screen size.
    try {
        const panelSys = this.locator.getSystem<PanelRegistrySystem>('PanelRegistrySystem');
        panelSys.refreshAll();
    } catch (e) {
        // System might not be ready on first frame, ignore.
    }
  }
}
