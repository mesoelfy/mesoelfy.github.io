import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { InputSystem } from '../systems/InputSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { BreachSystem } from '../systems/BreachSystem';
import { FXManager } from '../systems/FXManager';

class ServiceLocatorCore {
  public entitySystem: EntitySystem;
  public collisionSystem: CollisionSystem;
  public waveSystem: WaveSystem;
  public interactionSystem: InteractionSystem;
  public inputSystem: InputSystem;
  public playerSystem: PlayerSystem;
  public breachSystem: BreachSystem;
  public fxManager: typeof FXManager;

  public registerEntitySystem(sys: EntitySystem) { this.entitySystem = sys; }
  public registerCollisionSystem(sys: CollisionSystem) { this.collisionSystem = sys; }
  public registerWaveSystem(sys: WaveSystem) { this.waveSystem = sys; }
  public registerInteractionSystem(sys: InteractionSystem) { this.interactionSystem = sys; }
  public registerInputSystem(sys: InputSystem) { this.inputSystem = sys; }
  public registerPlayerSystem(sys: PlayerSystem) { this.playerSystem = sys; }
  public registerBreachSystem(sys: BreachSystem) { this.breachSystem = sys; }
  public registerFXManager(mgr: typeof FXManager) { this.fxManager = mgr; }
}

export const ServiceLocator = new ServiceLocatorCore();
