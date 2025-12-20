import { IGameSystem, IPhysicsSystem, ICombatSystem, IEntityRegistry } from '@/engine/interfaces';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ColliderData } from '@/engine/ecs/components/ColliderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';

export class CollisionSystem implements IGameSystem {
  private queryBuffer = new Int32Array(SYS_LIMITS.MAX_COLLISION_RESULTS);
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

        const queryRad = collider.shape === 'BOX' 
            ? Math.sqrt((collider.width/2)**2 + (collider.height/2)**2) + 1.0
            : collider.radius + 1.0;

        const count = spatial.query(transform.x, transform.y, queryRad, this.queryBuffer);

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

            if (this.checkCollision(transform, collider, otherTransform, otherCollider)) {
                this.combatSystem.resolveCollision(entity, other);
            }
        }
    }
  }

  private checkCollision(
      tA: TransformData, cA: ColliderData, 
      tB: TransformData, cB: ColliderData
  ): boolean {
      if (cA.shape === 'CIRCLE' && cB.shape === 'CIRCLE') {
          const dx = tA.x - tB.x;
          const dy = tA.y - tB.y;
          const rSum = cA.radius + cB.radius;
          return (dx * dx + dy * dy) < (rSum * rSum);
      }

      if (cA.shape === 'BOX' && cB.shape === 'BOX') {
          return (
              Math.abs(tA.x - tB.x) * 2 < (cA.width + cB.width) &&
              Math.abs(tA.y - tB.y) * 2 < (cA.height + cB.height)
          );
      }

      const circle = cA.shape === 'CIRCLE' ? { t: tA, c: cA } : { t: tB, c: cB };
      const box = cA.shape === 'BOX' ? { t: tA, c: cA } : { t: tB, c: cB };

      const boxHalfW = box.c.width / 2;
      const boxHalfH = box.c.height / 2;

      const distX = Math.abs(circle.t.x - box.t.x);
      const distY = Math.abs(circle.t.y - box.t.y);

      if (distX > (boxHalfW + circle.c.radius)) return false;
      if (distY > (boxHalfH + circle.c.radius)) return false;

      if (distX <= boxHalfW) return true; 
      if (distY <= boxHalfH) return true;

      const dx = distX - boxHalfW;
      const dy = distY - boxHalfH;
      return (dx*dx + dy*dy <= (circle.c.radius * circle.c.radius));
  }

  teardown(): void {}
}
