import { IPhysicsSystem, IServiceLocator } from '../core/interfaces';
import { SpatialGrid } from '../core/SpatialGrid';
import { TransformComponent } from '../components/data/TransformComponent';
import { MotionComponent } from '../components/data/MotionComponent';
import { EntityRegistry } from '../core/ecs/EntityRegistry';

export class PhysicsSystem implements IPhysicsSystem {
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
    
    // NEW: Query only entities that CAN move
    const movables = this.registry.query({ all: ['Transform', 'Motion'] });
    
    for (const entity of movables) {
      if (!entity.active) continue;

      const transform = entity.getComponent<TransformComponent>('Transform');
      const motion = entity.getComponent<MotionComponent>('Motion');
      
      // We know these exist because of the query, but TS type narrowing...
      if (transform && motion) {
        transform.x += motion.vx * delta;
        transform.y += motion.vy * delta;
        
        if (motion.friction > 0) {
            motion.vx *= (1 - motion.friction);
            motion.vy *= (1 - motion.friction);
        }

        this.spatialGrid.insert(entity.id, transform.x, transform.y);
      }
    }
  }

  teardown(): void {
    this.spatialGrid.clear();
  }
}
