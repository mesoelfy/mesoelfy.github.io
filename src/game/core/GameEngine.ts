import { IGameSystem, IServiceLocator } from './interfaces';
import { useGameStore } from '../store/useGameStore';
import { FXManager } from '../systems/FXManager';
import { ViewportHelper } from '../utils/ViewportHelper';
import { Registry } from './ecs/EntityRegistry';
import { Tag } from './ecs/types';
import { PanelRegistrySystem } from '../systems/PanelRegistrySystem'; 
import { GameStateSystem } from '../systems/GameStateSystem';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  private locator!: IServiceLocator;

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
    const gameSys = this.locator.getSystem<GameStateSystem>('GameStateSystem');
    
    // SYNC GLOBAL GAME OVER STATE
    if (store.isPlaying && store.systemIntegrity <= 0) {
        store.stopGame();
        FXManager.addTrauma(1.0);
        gameSys.isGameOver = true; // FORCE SYNC
        return;
    }

    // Force GameStateSystem to respect store if stopped manually
    if (!store.isPlaying) {
        gameSys.isGameOver = true;
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
    try {
        const panelSys = this.locator.getSystem<PanelRegistrySystem>('PanelRegistrySystem');
        panelSys.refreshAll();
    } catch (e) {
    }
  }
}
