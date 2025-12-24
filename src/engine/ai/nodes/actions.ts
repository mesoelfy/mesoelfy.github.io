import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PanelId } from '@/engine/config/PanelConfig';
import { AITimerID } from '@/engine/ai/AITimerID';
import { EnemyType } from '@/engine/config/Identifiers';

export class MoveToTarget extends BTNode {
  // Optional override keys for specific param names
  constructor(private speedKey: string = 'moveSpeed', private stopKey: string = 'approachStopDist') { super(); }
  
  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const identity = entity.getComponent<IdentityData>(ComponentType.Identity);

    if (!transform || !motion || !target || !identity) return NodeState.FAILURE;
    
    if (state && state.stunTimer > 0) {
        state.stunTimer -= context.delta;
        return NodeState.RUNNING;
    }

    const params = context.config.enemies[identity.variant as EnemyType]?.params || {};
    const speed = params[this.speedKey] ?? 10;
    const stopDistance = params[this.stopKey] ?? 0;

    let tx = target.x, ty = target.y;
    if (target.type === 'PANEL' && target.id) {
        const rect = context.getPanelRect(target.id as PanelId);
        if (rect) {
            tx = Math.max(rect.left, Math.min(transform.x, rect.right));
            ty = Math.max(rect.bottom, Math.min(transform.y, rect.top));
        }
    }
    const dx = tx - transform.x, dy = ty - transform.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist <= stopDistance) {
        motion.vx = 0; motion.vy = 0;
        return NodeState.SUCCESS;
    }
    motion.vx = (dx / dist) * speed;
    motion.vy = (dy / dist) * speed;
    transform.rotation = Math.atan2(dy, dx);
    return NodeState.RUNNING;
  }
}

export class Wait extends BTNode {
  constructor(private minKey: string = 'waitDuration', private maxKey?: string) { super(); }
  
  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
    if (!state || !identity) return NodeState.FAILURE;

    const params = context.config.enemies[identity.variant as EnemyType]?.params || {};
    const min = params[this.minKey] ?? 0.5;
    const max = this.maxKey ? (params[this.maxKey] ?? min) : min;

    if (state.timers[AITimerID.WAIT] === undefined) {
        state.timers[AITimerID.WAIT] = min + Math.random() * (max - min);
    }
    state.timers[AITimerID.WAIT]! -= context.delta;
    if (state.timers[AITimerID.WAIT]! <= 0) {
        state.timers[AITimerID.WAIT] = undefined;
        return NodeState.SUCCESS;
    }
    return NodeState.RUNNING;
  }
}

export class SpinVisual extends BTNode {
  constructor(private speedKey: string = 'spinSpeed', private fallback: number = 5.0) { super(); }
  tick(entity: Entity, context: AIContext): NodeState {
      const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
      const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
      if (visual) {
          let speed = this.fallback;
          if (identity) {
              const params = context.config.enemies[identity.variant as EnemyType]?.params;
              if (params && params[this.speedKey] !== undefined) speed = params[this.speedKey];
          }
          visual.rotation += context.delta * speed;
      }
      return NodeState.SUCCESS;
  }
}
