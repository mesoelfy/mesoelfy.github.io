import { useGameStore } from '../store/useGameStore';
import { GameEventBus } from '../events/GameEventBus';
import { GameEvents } from '../config/Identifiers';
import { FXManager } from '../systems/FXManager';
import { ServiceLocator } from './ServiceLocator';
import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { InputSystem } from '../systems/InputSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { BreachSystem } from '../systems/BreachSystem';
import { ViewportHelper } from '../utils/ViewportHelper';

class GameEngineCore {
  private entitySystem: EntitySystem;
  private collisionSystem: CollisionSystem;
  private waveSystem: WaveSystem;
  private interactionSystem: InteractionSystem;
  private inputSystem: InputSystem;
  private playerSystem: PlayerSystem;
  private breachSystem: BreachSystem;
  
  public isRepairing = false;
  
  private lastDamageTime = 0; 
  private prevPanelHealth: Record<string, number> = {};

  constructor() {
    FXManager.init();
    this.entitySystem = new EntitySystem();
    this.collisionSystem = new CollisionSystem(this.entitySystem);
    this.waveSystem = new WaveSystem();
    this.interactionSystem = new InteractionSystem();
    this.inputSystem = new InputSystem();
    this.playerSystem = new PlayerSystem();
    this.breachSystem = new BreachSystem();

    ServiceLocator.registerEntitySystem(this.entitySystem);
    ServiceLocator.registerCollisionSystem(this.collisionSystem);
    ServiceLocator.registerWaveSystem(this.waveSystem);
    ServiceLocator.registerInteractionSystem(this.interactionSystem);
    ServiceLocator.registerInputSystem(this.inputSystem);
    ServiceLocator.registerPlayerSystem(this.playerSystem);
    ServiceLocator.registerBreachSystem(this.breachSystem);
    ServiceLocator.registerFXManager(FXManager);
  }

  public get enemies() { return this.entitySystem.enemies; }
  public get bullets() { return this.entitySystem.bullets; }
  public get enemyBullets() { return this.entitySystem.enemyBullets; }
  public get particles() { return this.entitySystem.particles; }

  public updateViewport(vpW: number, vpH: number, screenW: number, screenH: number) {
    ViewportHelper.update(vpW, vpH, screenW, screenH);
  }

  public update(delta: number, time: number) {
    // 0. Game Over Check
    const store = useGameStore.getState();
    if (store.isPlaying && store.systemIntegrity <= 0) {
        store.stopGame();
        // Trigger Massive Trauma
        FXManager.addTrauma(1.0);
        return;
    }

    // 1. Systems Update
    this.checkPanelStates();
    
    const { threatLevel } = store;
    const cursor = this.inputSystem.getCursorPosition();
    
    // 2. Wave Logic
    this.waveSystem.update(time, threatLevel);
    this.breachSystem.update(time); // Spawn from dead panels

    // 3. Interaction Logic
    this.isRepairing = this.interactionSystem.update(time, cursor);

    // 4. Player Logic
    this.playerSystem.update(time);

    // 5. Physics & Entities
    const doDamageTick = time > this.lastDamageTime + 0.5; 
    if (doDamageTick) this.lastDamageTime = time;

    this.entitySystem.update(delta, time, cursor, doDamageTick);
    this.collisionSystem.update(cursor);
  }

  private checkPanelStates() {
    const panels = useGameStore.getState().panels;
    for (const id in panels) {
      const currentHealth = panels[id].health;
      const prevHealth = this.prevPanelHealth[id]; 
      if (prevHealth !== undefined && prevHealth > 0 && currentHealth <= 0) {
        GameEventBus.emit(GameEvents.PANEL_DESTROYED, { id });
        // Recalculate integrity immediately on death
        useGameStore.getState().recalculateIntegrity();
      }
      this.prevPanelHealth[id] = currentHealth;
    }
  }
}

export const GameEngine = new GameEngineCore();
