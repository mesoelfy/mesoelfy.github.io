import { IGameSystem, IServiceLocator, IPhysicsSystem, ICombatSystem } from '@/engine/interfaces';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { ComponentType } from '@/engine/ecs/ComponentType';

const MAX_COLLISION_RESULTS = 128;

export class CollisionSystem implements IGameSystem {
  private physicsSystem!: IPhysicsSystem;
  private registry!: EntityRegistry;
  private combatSystem!: ICombatSystem;
  private queryBuffer = new Int32Array(MAX_COLLISION_RESULTS);
  private handledPairs = new Set<number>(); 

  setup(locator: IServiceLocator): void {
    this.physicsSystem = locator.getSystem<IPhysicsSystem>('PhysicsSystem');
    this.combatSystem = locator.getSystem<ICombatSystem>('CombatSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const spatial = this.physicsSystem.spatialGrid;
    const collidables = this.registry.query({ all: [ComponentType.Collider, ComponentType.Transform] });
    
    this.handledPairs.clear();

    for (const entity of collidables) {
        if (!entity.active) continue;

        const collider = entity.getComponent<ColliderData>(ComponentType.Collider);
        if (!collider || collider.mask === 0) continue;

        const transform = entity.getComponent<TransformData>(ComponentType.Transform);
        if (!transform) continue;

        const state = entity.getComponent<AIStateData>(ComponentType.State);
        if (state && state.current === 'SPAWN') continue;

        const count = spatial.query(transform.x, transform.y, collider.radius + 1.0, this.queryBuffer);

        for (let i = 0; i < count; i++) {
            const otherId = this.queryBuffer[i];
            
            if (otherId === entity.id) continue;

            const idA = entity.id as number;
            const idB = otherId;
            const minId = idA < idB ? idA : idB;
            const maxId = idA < idB ? idB : idA;
            const pairKey = (minId << 16) | maxId;

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
