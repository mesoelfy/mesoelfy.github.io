import { IPhysicsSystem, IEntityRegistry } from '@/core/interfaces';
import { SpatialGrid } from '@/core/ecs/SpatialGrid';
import { TransformData } from '@/game/data/TransformData';
import { MotionData } from '@/game/data/MotionData';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { ComponentType } from '@/core/ecs/ComponentType';

export class PhysicsSystem implements IPhysicsSystem {
  public spatialGrid: SpatialGrid;
  private registry: EntityRegistry;

  // INJECTION: We now require the Registry in the constructor
  constructor(registry: IEntityRegistry) {
    this.spatialGrid = new SpatialGrid();
    this.registry = registry as EntityRegistry;
    this.spatialGrid.clear();
  }

  update(delta: number, time: number): void {
    this.spatialGrid.clear();
    
    const movables = this.registry.query({ all: [ComponentType.Transform, ComponentType.Motion] });
    
    for (const entity of movables) {
      if (!entity.active) continue;

      const transform = entity.getComponent<TransformData>(ComponentType.Transform);
      const motion = entity.getComponent<MotionData>(ComponentType.Motion);
      
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
