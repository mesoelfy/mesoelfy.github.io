import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { AITimerID } from '@/engine/ai/AITimerID';

export class SpawnPhase extends BTNode {
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    
    if (!state) return NodeState.SUCCESS;
    if (state.timers[AITimerID.SPAWN] === undefined) {
        state.timers[AITimerID.SPAWN] = this.duration;
        state.current = AI_STATE.SPAWN;
        if (effect) {
            effect.spawnProgress = 0.0;
        }
    }

    if (state.timers[AITimerID.SPAWN]! > 0) {
        state.timers[AITimerID.SPAWN]! -= context.delta;
        
        if (transform && target) {
            const dx = target.x - transform.x;
            const dy = target.y - transform.y;
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                const targetAngle = Math.atan2(dy, dx);
                transform.rotation = targetAngle;
            }
        }

        if (effect && visual) {
            const t = 1.0 - (state.timers[AITimerID.SPAWN]! / this.duration);
            effect.spawnProgress = Math.max(0, Math.min(1, t));
            
            if (t < 0.8) {
                visual.scale = t / 0.8;
            } else {
                const popT = (t - 0.8) / 0.2;
                visual.scale = 1.0 + (Math.sin(popT * Math.PI) * 0.25);
            }
            visual.rotation += (1.0 - t) * 15.0 * context.delta;
        }
        return NodeState.RUNNING;
    }

    if (state.current === AI_STATE.SPAWN) {
        state.current = AI_STATE.ACTIVE;
        if (effect && visual) {
            effect.spawnProgress = 1.0;
            visual.scale = 1.0;
            effect.flash = 0.6; 
        }
    }
    return NodeState.SUCCESS;
  }
}
