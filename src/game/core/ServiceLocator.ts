import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { FXManager } from '../systems/FXManager';

class ServiceLocatorCore {
  public entitySystem: EntitySystem;
  public collisionSystem: CollisionSystem;
  public fxManager: typeof FXManager;

  constructor() {
    // Systems will be registered by the GameEngine on init
  }

  public registerEntitySystem(sys: EntitySystem) {
    this.entitySystem = sys;
  }

  public registerCollisionSystem(sys: CollisionSystem) {
    this.collisionSystem = sys;
  }

  public registerFXManager(mgr: typeof FXManager) {
    this.fxManager = mgr;
  }
}

export const ServiceLocator = new ServiceLocatorCore();
