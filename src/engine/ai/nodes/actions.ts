import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class MoveToTarget extends BTNode {
  constructor(private speed: number, private stopDistance: number = 0) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);

    if (!transform || !motion || !target) return NodeState.FAILURE;

    // --- STUN LOGIC ---
    if (state && state.stunTimer > 0) {
        state.stunTimer -= context.delta;
        return NodeState.RUNNING;
    }

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
  private min: number;
  private max: number;

  constructor(min: number, max?: number) { 
    super(); 
    this.min = min;
    this.max = max ?? min;
  }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<any>(ComponentType.State);
    if (!state) return NodeState.FAILURE;

    if (state.timers.wait === undefined) {
        // Randomize duration on entry
        state.timers.wait = this.min + Math.random() * (this.max - this.min);
    }

    state.timers.wait -= context.delta;
    
    if (state.timers.wait <= 0) {
        state.timers.wait = undefined; 
        return NodeState.SUCCESS;
    }

    return NodeState.RUNNING;
  }
}

export class SpinVisual extends BTNode {
  constructor(private speed: number) { super(); }
  
  tick(entity: Entity, context: AIContext): NodeState {
      const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      if (visual) {
          visual.rotation += context.delta * this.speed;
      }
      return NodeState.SUCCESS;
  }
}
