import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AI_STATE } from '@/engine/ai/AIStateTypes';

export class SpawnPhase extends BTNode {
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const render = entity.getComponent<RenderData>(ComponentType.Render);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    
    if (!state) return NodeState.SUCCESS;

    if (state.timers.spawn === undefined) {
        state.timers.spawn = this.duration;
        state.current = AI_STATE.SPAWN;
        if (render) {
            render.spawnProgress = 0.0;
        }
    }

    if (state.timers.spawn > 0) {
        state.timers.spawn -= context.delta;
        
        if (transform && target) {
            const dx = target.x - transform.x;
            const dy = target.y - transform.y;
            if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                const targetAngle = Math.atan2(dy, dx);
                transform.rotation = targetAngle;
            }
        }

        if (render) {
            const t = 1.0 - (state.timers.spawn / this.duration);
            render.spawnProgress = Math.max(0, Math.min(1, t));
            
            if (t < 0.8) {
                render.visualScale = t / 0.8; 
            } else {
                const popT = (t - 0.8) / 0.2; 
                render.visualScale = 1.0 + (Math.sin(popT * Math.PI) * 0.25);
            }

            render.visualRotation += (1.0 - t) * 15.0 * context.delta;
        }

        return NodeState.RUNNING;
    }

    if (state.current === AI_STATE.SPAWN) {
        state.current = AI_STATE.ACTIVE;
        if (render) {
            render.spawnProgress = 1.0;
            render.visualScale = 1.0;
            render.flash = 0.6; 
        }
    }

    return NodeState.SUCCESS;
  }
}
