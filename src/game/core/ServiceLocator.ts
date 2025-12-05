import { EntitySystem } from '../systems/EntitySystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { FXManager } from '../systems/FXManager';

class ServiceLocatorCore {
  public entitySystem: EntitySystem;
  public collisionSystem: CollisionSystem;
  public waveSystem: WaveSystem;
  public fxManager: typeof FXManager;

  constructor() {
    // Systems registered on init
  }

  public registerEntitySystem(sys: EntitySystem) {
    this.entitySystem = sys;
  }

  public registerCollisionSystem(sys: CollisionSystem) {
    this.collisionSystem = sys;
  }
  
  public registerWaveSystem(sys: WaveSystem) {
    this.waveSystem = sys;
  }

  public registerFXManager(mgr: typeof FXManager) {
    this.fxManager = mgr;
  }
}

export const ServiceLocator = new ServiceLocatorCore();
