import { IGameSystem, IServiceLocator, IEntityRegistry } from './interfaces';
import { useGameStore } from '../store/useGameStore';
import { useStore } from '@/core/store/useStore';
import { FXManager } from '../systems/FXManager';
import { ViewportHelper } from '../utils/ViewportHelper';
import { PanelRegistrySystem } from '../systems/PanelRegistrySystem'; 
import { GameStateSystem } from '../systems/GameStateSystem';
import { WorldConfig } from '../config/WorldConfig';
import { TimeSystem } from '../systems/TimeSystem';

export class GameEngineCore implements IGameSystem {
  private systems: IGameSystem[] = [];
  private locator!: IServiceLocator;
  public registry: IEntityRegistry; 
  
  // Accumulator for Fixed Timestep
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
    
    // 1. CHECK STATES
    if (store.bootState === 'standby') return;
    if (store.activeModal === 'settings' || store.isDebugOpen) return;

    const gameSys = this.locator.getSystem<GameStateSystem>('GameStateSystem');
    
    // Game Over Logic
    if (gameStore.isPlaying && gameStore.systemIntegrity <= 0) {
        gameStore.stopGame();
        FXManager.addTrauma(1.0);
        gameSys.isGameOver = true; 
        return;
    }

    if (!gameStore.isPlaying) {
        gameSys.isGameOver = true;
    }

    // 2. GET TIME SCALING
    // We need to fetch the TimeSystem to check for HitStop/Freeze effects
    let timeScale = 1.0;
    try {
        const timeSys = this.locator.getSystem<TimeSystem>('TimeSystem');
        // If frozen, we stop adding to the accumulator
        if (timeSys.isFrozen()) timeScale = 0.0;
        else timeScale = timeSys.timeScale;
    } catch {}

    const debugScale = store.debugFlags.timeScale;
    
    // 3. ACCUMULATE TIME
    // "effectiveDelta" is how much "Game Time" passed during this "Real Time" frame
    const effectiveDelta = renderDelta * timeScale * debugScale;
    
    this.accumulator += effectiveDelta;

    // Safety Clamp: If browser hangs, don't try to simulate 1000 frames at once
    if (this.accumulator > WorldConfig.time.maxAccumulator) {
        this.accumulator = WorldConfig.time.maxAccumulator;
    }

    // 4. FIXED UPDATE LOOP
    const fixedStep = WorldConfig.time.fixedDelta;

    while (this.accumulator >= fixedStep) {
        
        // Run all systems with fixedStep (0.0166)
        // This ensures Physics is always calculated with the same numbers
        for (const sys of this.systems) {
            sys.update(fixedStep, this.simulationTime);
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
        // System might not be registered yet on first mount
    }
  }
}
