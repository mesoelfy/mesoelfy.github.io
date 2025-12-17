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

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  public registry: IEntityRegistry; 
  
  private accumulator: number = 0;
  private simulationTime: number = 0;

  constructor(registry: IEntityRegistry) {
      this.registry = registry;
  }

  // Locator is stored for potential late-binding, but systems are now fully initialized via constructor
  setup(locator: IServiceLocator): void {
    // No-op for now, kept if engine needs direct access later
  }

  public registerSystem(system: IGameSystem) {
    this.systems.push(system);
  }

  update(renderDelta: number, renderTime: number): void {
    const store = useStore.getState();
    const gameStore = useGameStore.getState();
    
    if (store.bootState === 'standby') return;
    if (store.activeModal === 'settings' || store.isDebugOpen) return;
    if (store.isSimulationPaused) return;

    let isGameOver = false;
    let timeScale = 1.0;

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
        isGameOver = gameSys.isGameOver;
    } catch {}

    try {
        const timeSys = ServiceLocator.getSystem<TimeSystem>('TimeSystem');
        timeSys.tickRealTime(renderDelta);
        if (timeSys.isFrozen()) timeScale = 0.0;
        else timeScale = timeSys.timeScale;
    } catch {}

    const debugScale = store.debugFlags.timeScale;
    const effectiveDelta = renderDelta * timeScale * debugScale;
    
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
        // Safe refresh attempt
        const panelSys = ServiceLocator.getSystem<PanelRegistrySystem>('PanelRegistrySystem');
        if (panelSys) panelSys.refreshAll();
    } catch {}
  }
}
// Local import for ServiceLocator to avoid circular dependency issues in some bundlers,
// though usually we inject it. Here we use the global instance for the static helpers inside update().
import { ServiceLocator } from './ServiceLocator';
