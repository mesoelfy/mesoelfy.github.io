import { IGameSystem, IServiceLocator, IEntityRegistry, IPanelSystem, IGameStateSystem, IFastEventService, SystemPhase } from '@/engine/interfaces';
import { ViewportHelper } from '@/engine/math/ViewportHelper';
import { WorldConfig } from '@/engine/config/WorldConfig';
import { TimeSystem } from '@/engine/systems/TimeSystem';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[][] = [[], [], [], [], [], []];
  public registry: IEntityRegistry; 
  private accumulator: number = 0;
  private simulationTime: number = 0;
  private panelSystem: IPanelSystem | null = null;
  private gameSystem: IGameStateSystem | null = null;
  private timeSystem: TimeSystem | null = null;
  private fastEventBus: IFastEventService | null = null;

  // Internal State (Pushed from React via Bridge)
  private isPaused = false;
  private isWarmingUp = true;
  private timeScale = 1.0;

  constructor(registry: IEntityRegistry) {
      this.registry = registry;
  }

  public setEngineState(state: { isPaused: boolean; isWarmingUp: boolean; timeScale: number }) {
      this.isPaused = state.isPaused;
      this.isWarmingUp = state.isWarmingUp;
      this.timeScale = state.timeScale;
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
    if (this.isPaused) return;

    if (!this.isWarmingUp) {
        if (this.fastEventBus) {
            this.fastEventBus.swap();
        }

        let localTimeScale = 1.0;
        if (this.timeSystem) {
            this.timeSystem.tickRealTime(renderDelta);
            if (this.timeSystem.isFrozen()) localTimeScale = 0.0;
            else localTimeScale = this.timeSystem.timeScale;
        }

        const effectiveDelta = renderDelta * localTimeScale * this.timeScale;
        this.accumulator += effectiveDelta;

        if (this.accumulator > WorldConfig.time.maxAccumulator) {
            this.accumulator = WorldConfig.time.maxAccumulator;
        }

        const fixedStep = WorldConfig.time.fixedDelta;
        
        while (this.accumulator >= fixedStep) {
            for (let phase = 0; phase <= SystemPhase.STATE; phase++) {
                const phaseSystems = this.systems[phase];
                for (let i = 0; i < phaseSystems.length; i++) {
                    try {
                        phaseSystems[i].update(fixedStep, this.simulationTime);
                    } catch (e: any) {
                        console.error(`ERR_PHASE_${phase}:`, e);
                    }
                }
            }
            this.simulationTime += fixedStep;
            this.accumulator -= fixedStep;
        }
    }
    
    const alpha = this.isWarmingUp ? 1.0 : (this.accumulator / WorldConfig.time.fixedDelta);
    
    const renderSystems = this.systems[SystemPhase.RENDER];
    for (let i = 0; i < renderSystems.length; i++) {
        try {
            renderSystems[i].update(renderDelta, renderTime, alpha);
        } catch (e: any) {
            console.error(`ERR_PHASE_RENDER:`, e);
        }
    }
  }

  teardown(): void {
    for (const phase of this.systems) {
        for (const sys of phase) sys.teardown();
    }
    this.systems = [[], [], [], [], [], []];
    this.panelSystem = null; this.gameSystem = null; this.timeSystem = null; this.fastEventBus = null;
  }
  
  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    ViewportHelper.update(vpW, vpH, screenW, screenH);
    if (this.panelSystem) this.panelSystem.refreshAll();
  }
}
