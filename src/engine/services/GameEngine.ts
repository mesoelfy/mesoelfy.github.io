import { IGameSystem, IServiceLocator, IEntityRegistry, IPanelSystem } from '@/engine/interfaces';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { PanelRegistrySystem } from '@/engine/systems/PanelRegistrySystem'; 
import { GameStateSystem } from '@/engine/systems/GameStateSystem';
import { WorldConfig } from '@/engine/config/WorldConfig';
import { TimeSystem } from '@/engine/systems/TimeSystem';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';
import { ServiceLocator } from './ServiceLocator';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  public registry: IEntityRegistry; 
  private accumulator: number = 0;
  private simulationTime: number = 0;

  constructor(registry: IEntityRegistry) {
      this.registry = registry;
  }

  setup(locator: IServiceLocator): void {}

  public registerSystem(system: IGameSystem) {
    this.systems.push(system);
  }

  update(renderDelta: number, renderTime: number): void {
    const store = useStore.getState();
    const gameStore = useGameStore.getState();
    
    if (store.bootState === 'standby') return;
    if (store.activeModal === 'settings' || store.isDebugOpen) return;
    if (store.isSimulationPaused) return;

    try {
        const gameSys = ServiceLocator.getSystem<GameStateSystem>('GameStateSystem');
        const panelSys = ServiceLocator.getSystem<IPanelSystem>('PanelRegistrySystem');
        
        if (gameStore.isPlaying && panelSys.systemIntegrity <= 0) {
            gameStore.stopGame();
            GameEventBus.emit(GameEvents.TRAUMA_ADDED, { amount: 1.0 });
            gameSys.isGameOver = true; 
            return;
        }

        if (!gameStore.isPlaying) {
            gameSys.isGameOver = true;
        }
    } catch {}

    let timeScale = 1.0;
    try {
        const timeSys = ServiceLocator.getSystem<TimeSystem>('TimeSystem');
        timeSys.tickRealTime(renderDelta);
        if (timeSys.isFrozen()) timeScale = 0.0;
        else timeScale = timeSys.timeScale;
    } catch {}

    const effectiveDelta = renderDelta * timeScale * store.debugFlags.timeScale;
    this.accumulator += effectiveDelta;

    if (this.accumulator > WorldConfig.time.maxAccumulator) {
        this.accumulator = WorldConfig.time.maxAccumulator;
    }

    const fixedStep = WorldConfig.time.fixedDelta;

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
        const panelSys = ServiceLocator.getSystem<PanelRegistrySystem>('PanelRegistrySystem');
        if (panelSys) panelSys.refreshAll();
    } catch {}
  }
}
