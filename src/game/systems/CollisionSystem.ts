import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { PhysicsSystem } from './PhysicsSystem';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { TransformComponent } from '../components/data/TransformComponent';
import { StateComponent } from '../components/data/StateComponent';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { CombatSystem } from './CombatSystem'; 
import { Entity } from '../core/ecs/Entity';
import { EntityID } from '../core/ecs/types';

export class CollisionSystem implements IGameSystem {
  private physicsSystem!: PhysicsSystem;
  private registry!: EntityRegistry;
  private combatSystem!: CombatSystem;

  // OPTIMIZATION: Reusable buffers to avoid Garbage Collection stutter
  private resultBuffer = new Set<EntityID>();
  private handledPairs = new Set<string>();

  setup(locator: IServiceLocator): void {
    this.physicsSystem = locator.getSystem<PhysicsSystem>('PhysicsSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.combatSystem = locator.getSystem<CombatSystem>('CombatSystem');
  }

  update(delta: number, time: number): void {
    const spatial = this.physicsSystem.spatialGrid;
    const allEntities = this.registry.getAll();
    
    // Clear the pair cache once per frame
    this.handledPairs.clear();

    for (const entity of allEntities) {
        if (!entity.active) continue;

        const collider = entity.getComponent<ColliderComponent>('Collider');
        const transform = entity.getComponent<TransformComponent>('Transform');

        if (!collider || !transform || collider.mask === 0) continue;

        const state = entity.getComponent<StateComponent>('State');
        if (state && state.current === 'SPAWN') continue;

        // OPTIMIZED QUERY: Pass the buffer, don't create a new one
        spatial.query(transform.x, transform.y, collider.radius + 1.0, this.resultBuffer);

        for (const otherId of this.resultBuffer) {
            if (otherId === entity.id) continue;
            
            const id1 = entity.id < (otherId as number) ? entity.id : otherId;
            const id2 = entity.id < (otherId as number) ? otherId : entity.id;
            const pairId = `${id1}:${id2}`;
            
            if (this.handledPairs.has(pairId)) continue;
            this.handledPairs.add(pairId);

            const other = this.registry.getEntity(otherId as number);
            if (!other || !other.active) continue;

            const otherCollider = other.getComponent<ColliderComponent>('Collider');
            const otherTransform = other.getComponent<TransformComponent>('Transform');
            
            if (!otherCollider || !otherTransform) continue;

            const aHitsB = (collider.mask & otherCollider.layer) !== 0;
            const bHitsA = (otherCollider.mask & collider.layer) !== 0;
            if (!aHitsB && !bHitsA) continue;

            const dx = transform.x - otherTransform.x;
            const dy = transform.y - otherTransform.y;
            const distSq = dx * dx + dy * dy;
            const radiusSum = collider.radius + otherCollider.radius;

            if (distSq < radiusSum * radiusSum) {
                this.combatSystem.resolveCollision(entity, other);
            }
        }
    }
  }

  teardown(): void {}
}
