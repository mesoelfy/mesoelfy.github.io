import { IGameSystem, IServiceLocator, IPhysicsSystem, ICombatSystem } from '@/engine/interfaces';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { TransformData } from '@/sys/data/TransformData';
import { AIStateData } from '@/sys/data/AIStateData';
import { ColliderData } from '@/sys/data/ColliderData';
import { EntityID } from '@/engine/ecs/types';

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
    
    // 1. Get Candidates via Cached Query (Returns Set<Entity>, no alloc)
    const collidables = this.registry.query({ all: ['Collider', 'Transform'] });
    
    this.handledPairs.clear();

    for (const entity of collidables) {
        if (!entity.active) continue;

        const collider = entity.getComponent<ColliderData>('Collider');
        // OPTIMIZATION: Early exit if mask is 0
        if (!collider || collider.mask === 0) continue;

        const transform = entity.getComponent<TransformData>('Transform');
        if (!transform) continue;

        // Skip spawning entities
        const state = entity.getComponent<AIStateData>('State');
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

            const otherCollider = other.getComponent<ColliderData>('Collider');
            if (!otherCollider) continue;

            // OPTIMIZATION: Check Bitmask BEFORE getting Transform or calculating distance
            // This is the cheapest check we can do.
            const aHitsB = (collider.mask & otherCollider.layer) !== 0;
            const bHitsA = (otherCollider.mask & collider.layer) !== 0;
            if (!aHitsB && !bHitsA) continue;

            const otherTransform = other.getComponent<TransformData>('Transform');
            if (!otherTransform) continue;

            // OPTIMIZATION: Squared Distance Check (Avoid Math.sqrt)
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
