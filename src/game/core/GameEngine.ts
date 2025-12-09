import { IGameSystem, IServiceLocator, IEntityRegistry } from './interfaces';
import { useGameStore } from '../store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { FXManager } from '../systems/FXManager';
import { ViewportHelper } from '../utils/ViewportHelper';
import { PanelRegistrySystem } from '../systems/PanelRegistrySystem'; 
import { GameStateSystem } from '../systems/GameStateSystem';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  private locator!: IServiceLocator;
  public registry: IEntityRegistry; 

  constructor(registry: IEntityRegistry) {
      this.registry = registry;
  }

  setup(locator: IServiceLocator): void {
    this.locator = locator;
    FXManager.init();
  }

  public registerSystem(system: IGameSystem) {
    this.systems.push(system);
  }

  update(delta: number, time: number): void {
    const store = useStore.getState();
    const gameStore = useGameStore.getState();
    
    // 1. CHECK BOOT STATE
    if (store.bootState === 'standby') return;

    // 2. CHECK PAUSE STATE (Settings or Debug)
    if (store.activeModal === 'settings' || store.isDebugOpen) return;

    const gameSys = this.locator.getSystem<GameStateSystem>('GameStateSystem');
    
    // 3. GAME OVER CHECK
    if (gameStore.isPlaying && gameStore.systemIntegrity <= 0) {
        gameStore.stopGame();
        FXManager.addTrauma(1.0);
        gameSys.isGameOver = true; 
        return;
    }

    if (!gameStore.isPlaying) {
        gameSys.isGameOver = true;
    }

    // 4. RUN SYSTEMS
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
