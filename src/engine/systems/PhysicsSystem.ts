import { IPhysicsSystem, IEntityRegistry } from '@/engine/interfaces';
import { SpatialGrid } from '@/engine/ecs/SpatialGrid';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class PhysicsSystem implements IPhysicsSystem {
  public spatialGrid: SpatialGrid;
  private registry: EntityRegistry;

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
