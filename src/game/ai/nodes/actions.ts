import { BTNode, NodeState } from '@/core/ai/behavior/types';
import { Entity } from '@/core/ecs/Entity';
import { AIContext } from '@/game/handlers/ai/types';
import { TransformData } from '@/game/data/TransformData';
import { MotionData } from '@/game/data/MotionData';
import { TargetData } from '@/game/data/TargetData';
import { RenderData } from '@/game/data/RenderData';
import { ComponentType } from '@/core/ecs/ComponentType';

export class MoveToTarget extends BTNode {
  constructor(private speed: number, private stopDistance: number = 0) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const target = entity.getComponent<TargetData>(ComponentType.Target);

    if (!transform || !motion || !target) return NodeState.FAILURE;

    let tx = target.x;
    let ty = target.y;

    if (target.type === 'PANEL' && target.id) {
        const rect = context.getPanelRect(target.id);
        if (rect) {
            tx = Math.max(rect.left, Math.min(transform.x, rect.right));
            ty = Math.max(rect.bottom, Math.min(transform.y, rect.top));
        }
    }

    const dx = tx - transform.x;
    const dy = ty - transform.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist <= this.stopDistance) {
        motion.vx = 0;
        motion.vy = 0;
        return NodeState.SUCCESS;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    motion.vx = nx * this.speed;
    motion.vy = ny * this.speed;
    transform.rotation = Math.atan2(dy, dx);

    return NodeState.RUNNING;
  }
}

export class Wait extends BTNode {
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<any>(ComponentType.State);
    if (!state) return NodeState.FAILURE;

    // Use a simpler check: if undefined or <= 0, start new wait
    // But since this node might be polled repeatedly in a MemSequence, we need to be careful.
    // MemSequence keeps us RUNNING.
    
    if (state.timers.wait === undefined) {
        state.timers.wait = this.duration;
    }

    state.timers.wait -= context.delta;
    
    if (state.timers.wait <= 0) {
        state.timers.wait = undefined; // Cleanup for next usage
        return NodeState.SUCCESS;
    }

    return NodeState.RUNNING;
  }
}

export class SpinVisual extends BTNode {
  constructor(private speed: number) { super(); }
  
  tick(entity: Entity, context: AIContext): NodeState {
      const render = entity.getComponent<RenderData>(ComponentType.Render);
      if (render) {
          render.visualRotation += context.delta * this.speed;
      }
      return NodeState.SUCCESS;
  }
}
