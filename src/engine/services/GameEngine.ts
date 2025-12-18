import { IGameSystem, IServiceLocator, IEntityRegistry, IPanelSystem, IGameStateSystem } from '@/engine/interfaces';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { WorldConfig } from '@/engine/config/WorldConfig';
import { TimeSystem } from '@/engine/systems/TimeSystem';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  public registry: IEntityRegistry; 
  private accumulator: number = 0;
  private simulationTime: number = 0;

  // Core System References (Injected)
  private panelSystem: IPanelSystem | null = null;
  private gameSystem: IGameStateSystem | null = null;
  private timeSystem: TimeSystem | null = null;

  constructor(registry: IEntityRegistry) {
      this.registry = registry;
  }

  // Dependency Injection Point
  public injectCoreSystems(panel: IPanelSystem, game: IGameStateSystem, time: TimeSystem) {
      this.panelSystem = panel;
      this.gameSystem = game;
      this.timeSystem = time;
  }

  setup(locator: IServiceLocator): void {
      // Legacy compatibility if needed, but we prefer explicit injection above
  }

  public registerSystem(system: IGameSystem) {
    this.systems.push(system);
  }

  update(renderDelta: number, renderTime: number): void {
    const store = useStore.getState();
    const gameStore = useGameStore.getState();
    
    // 1. Global Pause Checks
    if (store.bootState === 'standby') return;
    if (store.activeModal === 'settings' || store.isDebugOpen) return;
    if (store.isSimulationPaused) return;

    // 2. Game Over Logic
    // We use the injected references instead of the ServiceLocator
    if (this.gameSystem && this.panelSystem) {
        if (gameStore.isPlaying && this.panelSystem.systemIntegrity <= 0) {
            gameStore.stopGame();
            GameEventBus.emit(GameEvents.TRAUMA_ADDED, { amount: 1.0 });
            this.gameSystem.isGameOver = true; 
            return;
        }

        if (!gameStore.isPlaying) {
            this.gameSystem.isGameOver = true;
        }
    }

    // 3. Time Management
    let timeScale = 1.0;
    if (this.timeSystem) {
        this.timeSystem.tickRealTime(renderDelta);
        if (this.timeSystem.isFrozen()) timeScale = 0.0;
        else timeScale = this.timeSystem.timeScale;
    }

    const effectiveDelta = renderDelta * timeScale * store.debugFlags.timeScale;
    this.accumulator += effectiveDelta;

    // 4. Spiral of Death Protection
    if (this.accumulator > WorldConfig.time.maxAccumulator) {
        this.accumulator = WorldConfig.time.maxAccumulator;
    }

    const fixedStep = WorldConfig.time.fixedDelta;

    // 5. Fixed Timestep Loop
    while (this.accumulator >= fixedStep) {
        for (const sys of this.systems) {
            try {
                sys.update(fixedStep, this.simulationTime);
            } catch (e: any) {
                console.error("System Update Error:", e);
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
    this.panelSystem = null;
    this.gameSystem = null;
    this.timeSystem = null;
  }
  
  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    ViewportHelper.update(vpW, vpH, screenW, screenH);
    if (this.panelSystem) {
        this.panelSystem.refreshAll();
    }
  }
}
