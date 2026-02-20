import { IGameSystem, IEntityRegistry, IPhysicsSystem } from '@/engine/interfaces';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { Query } from '@/engine/ecs/Query';
import { Entity } from '@/engine/ecs/Entity';
import { Tag } from '@/engine/ecs/types';
import { SYS_LIMITS } from '@/engine/config/constants/SystemConstants';

export class HomingSystem implements IGameSystem {
  private homingQuery = new Query({ all: [ComponentType.Projectile, ComponentType.Transform, ComponentType.Motion, ComponentType.Target] });
  private queryBuffer = new Int32Array(SYS_LIMITS.MAX_COLLISION_RESULTS);

  constructor(private registry: IEntityRegistry, private physics: IPhysicsSystem) {}

  update(delta: number, time: number): void {
    const projectiles = this.registry.query(this.homingQuery);
    for (const p of projectiles) {
        if (!p.active) continue;
        const transform = p.getComponent<TransformData>(ComponentType.Transform)!;
        const motion = p.getComponent<MotionData>(ComponentType.Motion)!;
        const target = p.getComponent<TargetData>(ComponentType.Target)!;

        if (target.type === 'ENEMY') {
            this.handleSteering(p, transform, motion, delta);
        }
    }
  }

  private handleSteering(entity: Entity, transform: TransformData, motion: MotionData, delta: number) {
      const targetData = entity.getComponent<TargetData>(ComponentType.Target);
      if (!targetData) return;

      if (!targetData.id || targetData.id === 'ENEMY_LOCKED') {
          const RANGE = 20;
          const count = this.physics.spatialGrid.query(transform.x, transform.y, RANGE, this.queryBuffer);
          let minDist = Infinity;
          let bestTarget: Entity | null = null;

          for(let i=0; i<count; i++) {
              const other = this.registry.getEntity(this.queryBuffer[i]);
              if (!other || !other.active || !other.hasTag(Tag.ENEMY)) continue;
              const t2 = other.getComponent<TransformData>(ComponentType.Transform);
              if (!t2) continue;
              const d = (t2.x - transform.x)**2 + (t2.y - transform.y)**2;
              if (d < minDist) { minDist = d; bestTarget = other; }
          }
          if (bestTarget) targetData.id = bestTarget.id.toString();
      }

      if (targetData.id) {
          const targetEntity = this.registry.getEntity(parseInt(targetData.id));
          if (!targetEntity || !targetEntity.active) { targetData.id = null; return; }

          const t2 = targetEntity.getComponent<TransformData>(ComponentType.Transform);
          if (t2) {
              const desiredAngle = Math.atan2(t2.y - transform.y, t2.x - transform.x);
              const currentAngle = Math.atan2(motion.vy, motion.vx);
              let diff = desiredAngle - currentAngle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;

              const TURN_SPEED = 8.0; 
              const turn = Math.max(-TURN_SPEED * delta, Math.min(TURN_SPEED * delta, diff));
              const newAngle = currentAngle + turn;
              const speed = Math.sqrt(motion.vx*motion.vx + motion.vy*motion.vy);
              
              motion.vx = Math.cos(newAngle) * speed;
              motion.vy = Math.sin(newAngle) * speed;
          }
      }
  }

  teardown() {}
}
