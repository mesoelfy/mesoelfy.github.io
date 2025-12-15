import { IGameSystem, IServiceLocator, IPhysicsSystem, ICombatSystem } from '@/engine/interfaces';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { TransformData } from '@/sys/data/TransformData';
import { AIStateData } from '@/sys/data/AIStateData';
import { ColliderData } from '@/sys/data/ColliderData';
import { EntityID } from '@/engine/ecs/types';

const MAX_COLLISION_RESULTS = 128; // Max neighbors to check per entity

export class CollisionSystem implements IGameSystem {
  private physicsSystem!: IPhysicsSystem;
  private registry!: EntityRegistry;
  private combatSystem!: ICombatSystem;

  // Pre-allocated buffers to avoid GC
  private queryBuffer = new Int32Array(MAX_COLLISION_RESULTS);
  
  // Bitset for deduplication could be added if needed, 
  // but for simple point-bucket hashing, we mostly trust the grid.
  // We use a simple pair check here.
  private handledPairs = new Set<number>(); // We'll encode pairs as numbers if possible or string

  setup(locator: IServiceLocator): void {
    this.physicsSystem = locator.getSystem<IPhysicsSystem>('PhysicsSystem');
    this.combatSystem = locator.getSystem<ICombatSystem>('CombatSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const spatial = this.physicsSystem.spatialGrid;
    const collidables = this.registry.query({ all: ['Collider', 'Transform'] });
    
    // Clear pairs (Set.clear() is optimized in V8)
    this.handledPairs.clear();

    for (const entity of collidables) {
        if (!entity.active) continue;

        const collider = entity.getComponent<ColliderData>('Collider');
        if (!collider || collider.mask === 0) continue;

        const transform = entity.getComponent<TransformData>('Transform');
        if (!transform) continue;

        const state = entity.getComponent<AIStateData>('State');
        if (state && state.current === 'SPAWN') continue;

        // 1. Broad Phase: Zero-alloc query
        const count = spatial.query(transform.x, transform.y, collider.radius + 1.0, this.queryBuffer);

        // 2. Narrow Phase
        for (let i = 0; i < count; i++) {
            const otherId = this.queryBuffer[i];
            
            if (otherId === entity.id) continue;

            // Fast unique pair check using Int encoding (assuming IDs < 65535)
            // Combine two 16-bit IDs into one 32-bit integer key
            const idA = entity.id as number;
            const idB = otherId;
            const minId = idA < idB ? idA : idB;
            const maxId = idA < idB ? idB : idA;
            
            // Limit: This optimization works for IDs up to 65535.
            // If MAX_ENTITIES > 65k, use string keys. Currently MAX_ENTITIES=10000.
            const pairKey = (minId << 16) | maxId;

            if (this.handledPairs.has(pairKey)) continue;
            this.handledPairs.add(pairKey);

            const other = this.registry.getEntity(otherId);
            if (!other || !other.active) continue;

            const otherCollider = other.getComponent<ColliderData>('Collider');
            if (!otherCollider) continue;

            // Bitmask Check
            const aHitsB = (collider.mask & otherCollider.layer) !== 0;
            const bHitsA = (otherCollider.mask & collider.layer) !== 0;
            if (!aHitsB && !bHitsA) continue;

            const otherTransform = other.getComponent<TransformData>('Transform');
            if (!otherTransform) continue;

            // Squared Distance Check
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
