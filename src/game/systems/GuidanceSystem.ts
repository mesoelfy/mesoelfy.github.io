import { IGameSystem, IServiceLocator } from '@/core/interfaces';
import { EntityRegistry } from '@/core/ecs/EntityRegistry';
import { TransformData } from '@/game/data/TransformData';
import { MotionData } from '@/game/data/MotionData';
import { TargetData } from '@/game/data/TargetData';
import { Tag } from '@/core/ecs/types';
import { ComponentType } from '@/core/ecs/ComponentType';

export class GuidanceSystem implements IGameSystem {
  private registry!: EntityRegistry;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const bullets = this.registry.getByTag(Tag.BULLET);

    for (const b of bullets) {
        if (!b.active) continue;
        
        const target = b.getComponent<TargetData>(ComponentType.Target);
        const motion = b.getComponent<MotionData>(ComponentType.Motion);
        const transform = b.getComponent<TransformData>(ComponentType.Transform);

        if (!target || !motion || !transform || !target.id) continue;

        const dx = target.x - transform.x;
        const dy = target.y - transform.y;
        
        const desiredAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(motion.vy, motion.vx);
        
        let diff = desiredAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const turnSpeed = 4.0; 
        
        const maxTurn = turnSpeed * delta;
        const actualTurn = Math.max(-maxTurn, Math.min(maxTurn, diff));
        const newAngle = currentAngle + actualTurn;
        
        const speed = Math.sqrt(motion.vx * motion.vx + motion.vy * motion.vy);
        motion.vx = Math.cos(newAngle) * speed;
        motion.vy = Math.sin(newAngle) * speed;
        
        transform.rotation = newAngle;
    }
  }

  teardown(): void {}
}
