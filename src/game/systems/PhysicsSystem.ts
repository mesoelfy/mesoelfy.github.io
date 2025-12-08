import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { SpatialGrid } from '../core/SpatialGrid';
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { EntityRegistry } from '../core/ecs/EntityRegistry';

export class PhysicsSystem implements IGameSystem {
  public spatialGrid: SpatialGrid;
  private registry!: EntityRegistry;

  constructor() {
    this.spatialGrid = new SpatialGrid(4);
  }

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
    this.spatialGrid.clear();
  }

  update(delta: number, time: number): void {
    this.spatialGrid.clear();
    
    for (const entity of this.registry.getAll()) {
      if (!entity.active) continue;

      const transform = entity.getComponent<TransformComponent>('Transform');
      const motion = entity.getComponent<MotionComponent>('Motion');
      
      if (transform && motion) {
        // Apply Velocity
        transform.x += motion.vx * delta;
        transform.y += motion.vy * delta;
        
        // Friction / Damping
        if (motion.friction > 0) {
            motion.vx *= (1 - motion.friction);
            motion.vy *= (1 - motion.friction);
        }

        // Spatial Grid Insert
        this.spatialGrid.insert(entity.id, transform.x, transform.y);
      }
    }
  }

  teardown(): void {
    this.spatialGrid.clear();
  }
}
