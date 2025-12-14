import { IGameSystem, IServiceLocator } from '@/engine/interfaces';
import { EntityRegistry } from '@/engine/ecs/EntityRegistry';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { TargetData } from '@/sys/data/TargetData';
import { Tag } from '@/engine/ecs/types';

export class GuidanceSystem implements IGameSystem {
  private registry!: EntityRegistry;

  setup(locator: IServiceLocator): void {
    this.registry = locator.getRegistry() as EntityRegistry;
  }

  update(delta: number, time: number): void {
    const bullets = this.registry.getByTag(Tag.BULLET);

    for (const b of bullets) {
        if (!b.active) continue;
        
        // Only guide if it has a Target Component and has found a target
        const target = b.getComponent<TargetData>('Target');
        const motion = b.getComponent<MotionData>('Motion');
        const transform = b.getComponent<TransformData>('Transform');

        if (!target || !motion || !transform || !target.id) continue;

        // STEERING LOGIC
        const dx = target.x - transform.x;
        const dy = target.y - transform.y;
        
        // Desired Angle
        const desiredAngle = Math.atan2(dy, dx);
        
        // Current Angle (from velocity)
        const currentAngle = Math.atan2(motion.vy, motion.vx);
        
        // Angular difference (shortest path)
        let diff = desiredAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        // Turn Speed (Radians per second)
        // High turn speed = tighter homing
        const turnSpeed = 4.0; 
        
        // Apply Rotation
        const maxTurn = turnSpeed * delta;
        const actualTurn = Math.max(-maxTurn, Math.min(maxTurn, diff));
        
        const newAngle = currentAngle + actualTurn;
        
        // Maintain Speed, Change Direction
        const speed = Math.sqrt(motion.vx * motion.vx + motion.vy * motion.vy);
        motion.vx = Math.cos(newAngle) * speed;
        motion.vy = Math.sin(newAngle) * speed;
        
        // Update visual rotation to match velocity
        transform.rotation = newAngle;
    }
  }

  teardown(): void {}
}
