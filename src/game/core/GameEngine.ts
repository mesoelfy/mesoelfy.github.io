import { IGameSystem, IServiceLocator, IEntityRegistry } from './interfaces';
import { useGameStore } from '../store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { FXManager } from '../systems/FXManager';
import { ViewportHelper } from '../utils/ViewportHelper';
import { PanelRegistrySystem } from '../systems/PanelRegistrySystem'; 
import { GameStateSystem } from '../systems/GameStateSystem';
import { WorldConfig } from '../config/WorldConfig';
import { TimeSystem } from '../systems/TimeSystem';
import { GameEventBus } from '@/game/events/GameEventBus';
import { GameEvents } from '@/game/events/GameEvents';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  private locator!: IServiceLocator;
  public registry: IEntityRegistry; 
  
  private accumulator: number = 0;
  private simulationTime: number = 0;

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

  update(renderDelta: number, renderTime: number): void {
    const store = useStore.getState();
    const gameStore = useGameStore.getState();
    
    if (store.bootState === 'standby') return;
    if (store.activeModal === 'settings' || store.isDebugOpen) return;

    const gameSys = this.locator.getSystem<GameStateSystem>('GameStateSystem');
    
    if (gameStore.isPlaying && gameStore.systemIntegrity <= 0) {
        gameStore.stopGame();
        FXManager.addTrauma(1.0);
        gameSys.isGameOver = true; 
        return;
    }

    if (!gameStore.isPlaying) {
        gameSys.isGameOver = true;
    }

    // --- TIME MANAGEMENT ---
    
    let timeScale = 1.0;
    try {
        const timeSys = this.locator.getSystem<TimeSystem>('TimeSystem');
        
        // 1. Tick Real Time (Updates Freeze Timer)
        timeSys.tickRealTime(renderDelta);

        // 2. Determine if Frozen
        if (timeSys.isFrozen()) {
            timeScale = 0.0;
        } else {
            timeScale = timeSys.timeScale;
        }
    } catch {}

    const debugScale = store.debugFlags.timeScale;
    
    // 3. Accumulate Game Time
    const effectiveDelta = renderDelta * timeScale * debugScale;
    
    this.accumulator += effectiveDelta;

    if (this.accumulator > WorldConfig.time.maxAccumulator) {
        this.accumulator = WorldConfig.time.maxAccumulator;
    }

    const fixedStep = WorldConfig.time.fixedDelta;

    // 4. Run Physics Steps
    // If frozen, effectiveDelta is 0, accumulator doesn't grow, loop doesn't run.
    // But since tickRealTime ran above, freezeTimer decreases, and eventually
    // isFrozen() becomes false, effectiveDelta becomes > 0, and the game resumes.
    while (this.accumulator >= fixedStep) {
        for (const sys of this.systems) {
            try {
                sys.update(fixedStep, this.simulationTime);
            } catch (e: any) {
                console.error("System Update Error:", e);
                GameEventBus.emit(GameEvents.LOG_DEBUG, { 
                    msg: `CRASH IN SYSTEM: ${e.message}`, 
                    source: 'GameEngine' 
                });
            }
        }

        this.simulationTime += fixedStep;
        this.accumulator -= fixedStep;
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
