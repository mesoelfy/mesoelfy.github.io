import { IGameSystem, IServiceLocator, IEntityRegistry, IPanelSystem, IGameStateSystem, IFastEventService, SystemPhase } from '@/engine/interfaces';
import { useGameStore } from '@/engine/state/game/useGameStore';
import { useStore } from '@/engine/state/global/useStore';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { WorldConfig } from '@/engine/config/WorldConfig';
import { TimeSystem } from '@/engine/systems/TimeSystem';
import { GameEventBus } from '@/engine/signals/GameEventBus';
import { GameEvents } from '@/engine/signals/GameEvents';

export class GameEngineCore implements IGameSystem {
  // Array of Arrays for Phased Execution [Phase0[], Phase1[], ...]
  private systems: IGameSystem[][] = [[], [], [], [], [], []];
  
  public registry: IEntityRegistry; 
  private accumulator: number = 0;
  private simulationTime: number = 0;

  // Core System References (Injected)
  private panelSystem: IPanelSystem | null = null;
  private gameSystem: IGameStateSystem | null = null;
  private timeSystem: TimeSystem | null = null;
  private fastEventBus: IFastEventService | null = null;

  constructor(registry: IEntityRegistry) {
      this.registry = registry;
  }

  public injectCoreSystems(panel: IPanelSystem, game: IGameStateSystem, time: TimeSystem) {
      this.panelSystem = panel;
      this.gameSystem = game;
      this.timeSystem = time;
  }

  public injectFastEventBus(bus: IFastEventService) {
      this.fastEventBus = bus;
  }

  setup(locator: IServiceLocator): void {}

  public registerSystem(system: IGameSystem, phase: SystemPhase) {
    this.systems[phase].push(system);
  }

  update(renderDelta: number, renderTime: number): void {
    const store = useStore.getState();
    const gameStore = useGameStore.getState();
    
    if (store.bootState === 'standby') return;
    if (store.activeModal === 'settings' || store.isDebugOpen) return;
    if (store.isSimulationPaused) return;

    // Game Over Logic
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

    // Time Management
    let timeScale = 1.0;
    if (this.timeSystem) {
        this.timeSystem.tickRealTime(renderDelta);
        if (this.timeSystem.isFrozen()) timeScale = 0.0;
        else timeScale = this.timeSystem.timeScale;
    }

    const effectiveDelta = renderDelta * timeScale * store.debugFlags.timeScale;
    this.accumulator += effectiveDelta;

    if (this.accumulator > WorldConfig.time.maxAccumulator) {
        this.accumulator = WorldConfig.time.maxAccumulator;
    }

    const fixedStep = WorldConfig.time.fixedDelta;

    while (this.accumulator >= fixedStep) {
        // Clear Fast Event Buffer at START of simulation step
        // This ensures events generated in previous step (or render) are gone?
        // Actually, we want to clear at end of frame or start of frame.
        // If we clear here, we clear accumulated events from previous ticks?
        // Let's clear at the very end of the update loop.
        
        // Iterate Phases 0 to 5
        for (let phase = 0; phase < this.systems.length; phase++) {
            const phaseSystems = this.systems[phase];
            for (let i = 0; i < phaseSystems.length; i++) {
                try {
                    phaseSystems[i].update(fixedStep, this.simulationTime);
                } catch (e: any) {
                    console.error(`System Update Error [Phase ${phase}]:`, e);
                }
            }
        }
        this.simulationTime += fixedStep;
        this.accumulator -= fixedStep;
    }
    
    // Clear Fast Bus after all systems (including Render) have run
    if (this.fastEventBus) {
        this.fastEventBus.clear();
    }
  }

  teardown(): void {
    for (const phase of this.systems) {
        for (const sys of phase) {
            sys.teardown();
        }
    }
    this.systems = [[], [], [], [], [], []];
    this.panelSystem = null;
    this.gameSystem = null;
    this.timeSystem = null;
    this.fastEventBus = null;
  }
  
  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    ViewportHelper.update(vpW, vpH, screenW, screenH);
    if (this.panelSystem) {
        this.panelSystem.refreshAll();
    }
  }
}
