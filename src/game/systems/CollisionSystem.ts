import { IGameSystem, IServiceLocator, IPhysicsSystem, ICombatSystem } from '../core/interfaces';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { TransformComponent } from '../components/data/TransformComponent';
import { StateComponent } from '../components/data/StateComponent';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { EntityID } from '../core/ecs/types';

export class CollisionSystem implements IGameSystem {
  private physicsSystem!: IPhysicsSystem;
  private registry!: EntityRegistry;
  private combatSystem!: ICombatSystem;

  // Reusable buffers to avoid GC
  private resultBuffer = new Set<EntityID>();
  private handledPairs = new Set<string>();

  setup(locator: IServiceLocator): void {
    this.physicsSystem = locator.getSystem<IPhysicsSystem>('PhysicsSystem');
    this.combatSystem = locator.getSystem<ICombatSystem>('CombatSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const spatial = this.physicsSystem.spatialGrid;
    
    // 1. Get Candidates via Cached Query
    const collidables = this.registry.query({ all: ['Collider', 'Transform'] });
    
    this.handledPairs.clear();

    for (const entity of collidables) {
        if (!entity.active) continue;

        const collider = entity.getComponent<ColliderComponent>('Collider');
        const transform = entity.getComponent<TransformComponent>('Transform');

        // Safety check (Type Guard)
        if (!collider || !transform || collider.mask === 0) continue;

        // Skip spawning entities
        const state = entity.getComponent<StateComponent>('State');
        if (state && state.current === 'SPAWN') continue;

        // 2. Broad Phase (Zero-alloc query)
        // Check slightly larger radius to catch edge cases
        spatial.query(transform.x, transform.y, collider.radius + 1.0, this.resultBuffer);

        // 3. Narrow Phase
        for (const otherId of this.resultBuffer) {
            if (otherId === entity.id) continue;
            
            // Fast unique pair check (Smallest ID first)
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

            // Bitmask Check
            const aHitsB = (collider.mask & otherCollider.layer) !== 0;
            const bHitsA = (otherCollider.mask & collider.layer) !== 0;
            if (!aHitsB && !bHitsA) continue;

            // Circle-Circle Check
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
