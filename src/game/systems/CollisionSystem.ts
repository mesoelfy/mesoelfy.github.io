import { IGameSystem, IServiceLocator } from '../core/interfaces';
import { PhysicsSystem } from './PhysicsSystem';
import { EntityRegistry } from '../core/ecs/EntityRegistry';
import { TransformComponent } from '../components/data/TransformComponent';
import { StateComponent } from '../components/data/StateComponent';
import { ColliderComponent } from '../components/data/ColliderComponent';
import { CombatSystem } from './CombatSystem'; // Import Combat
import { Entity } from '../core/ecs/Entity';

export class CollisionSystem implements IGameSystem {
  private physicsSystem!: PhysicsSystem;
  private registry!: EntityRegistry;
  private combatSystem!: CombatSystem;

  setup(locator: IServiceLocator): void {
    this.physicsSystem = locator.getSystem<PhysicsSystem>('PhysicsSystem');
    this.registry = locator.getRegistry() as EntityRegistry;
    this.combatSystem = locator.getSystem<CombatSystem>('CombatSystem');
  }

  update(delta: number, time: number): void {
    const spatial = this.physicsSystem.spatialGrid;
    const allEntities = this.registry.getAll();
    const handledPairs = new Set<string>();

    for (const entity of allEntities) {
        if (!entity.active) continue;

        const collider = entity.getComponent<ColliderComponent>('Collider');
        const transform = entity.getComponent<TransformComponent>('Transform');

        if (!collider || !transform || collider.mask === 0) continue;

        const state = entity.getComponent<StateComponent>('State');
        if (state && state.current === 'SPAWN') continue;

        const nearby = spatial.query(transform.x, transform.y, collider.radius + 1.0);

        for (const otherId of nearby) {
            if (otherId === entity.id) continue;
            
            const id1 = entity.id < (otherId as number) ? entity.id : otherId;
            const id2 = entity.id < (otherId as number) ? otherId : entity.id;
            const pairId = `${id1}:${id2}`;
            
            if (handledPairs.has(pairId)) continue;
            handledPairs.add(pairId);

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
                // DELEGATE TO COMBAT SYSTEM
                this.combatSystem.resolveCollision(entity, other);
            }
        }
    }
  }

  teardown(): void {}
}
