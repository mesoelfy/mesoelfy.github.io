import { IGameSystem, IPhysicsSystem, ICombatSystem, IEntityRegistry } from '@/engine/interfaces';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { ComponentType } from '@/engine/ecs/ComponentType';

const MAX_COLLISION_RESULTS = 1024;

export class CollisionSystem implements IGameSystem {
  private queryBuffer = new Int32Array(MAX_COLLISION_RESULTS);
  private handledPairs = new Set<number>(); 

  constructor(
    private physicsSystem: IPhysicsSystem,
    private combatSystem: ICombatSystem,
    private registry: IEntityRegistry
  ) {}

  update(delta: number, time: number): void {
    const spatial = this.physicsSystem.spatialGrid;
    const collidables = this.registry.query({ all: [ComponentType.Collider, ComponentType.Transform] });
    this.handledPairs.clear();

    for (const entity of collidables) {
        if (!entity.active) continue;
        const collider = entity.getComponent<ColliderData>(ComponentType.Collider);
        const transform = entity.getComponent<TransformData>(ComponentType.Transform);
        if (!collider || collider.mask === 0 || !transform) continue;

        const state = entity.getComponent<AIStateData>(ComponentType.State);
        if (state && state.current === 'SPAWN') continue;

        const count = spatial.query(transform.x, transform.y, collider.radius + 1.0, this.queryBuffer);

        for (let i = 0; i < count; i++) {
            const otherId = this.queryBuffer[i];
            if (otherId === entity.id) continue;

            const idA = entity.id as number;
            const idB = otherId;
            const pairKey = (Math.min(idA, idB) << 16) | Math.max(idA, idB);
            if (this.handledPairs.has(pairKey)) continue;
            this.handledPairs.add(pairKey);

            const other = this.registry.getEntity(otherId);
            if (!other || !other.active) continue;

            const otherCollider = other.getComponent<ColliderData>(ComponentType.Collider);
            if (!otherCollider) continue;

            const aHitsB = (collider.mask & otherCollider.layer) !== 0;
            const bHitsA = (otherCollider.mask & collider.layer) !== 0;
            if (!aHitsB && !bHitsA) continue;

            const otherTransform = other.getComponent<TransformData>(ComponentType.Transform);
            if (!otherTransform) continue;

            const dx = transform.x - otherTransform.x;
            const dy = transform.y - otherTransform.y;
            const radiusSum = collider.radius + otherCollider.radius;

            if (dx * dx + dy * dy < radiusSum * radiusSum) {
                this.combatSystem.resolveCollision(entity, other);
            }
        }
    }
  }

  teardown(): void {}
}
