import { BTNode, NodeState } from '@/core/ai/behavior/types';
import { Entity } from '@/core/ecs/Entity';
import { AIContext } from '@/game/handlers/ai/types';
import { AIStateData } from '@/game/data/AIStateData';
import { RenderData } from '@/game/data/RenderData';
import { ComponentType } from '@/core/ecs/ComponentType';

export class SpawnPhase extends BTNode {
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const render = entity.getComponent<RenderData>(ComponentType.Render);
    
    if (!state) return NodeState.SUCCESS; // Skip if no state

    // Initialize timer if missing
    if (state.timers.spawn === undefined) {
        state.timers.spawn = this.duration;
        state.current = 'SPAWN';
    }

    if (state.timers.spawn > 0) {
        state.timers.spawn -= context.delta;
        
        // Visual Scale Effect (Pop in)
        if (render) {
            const progress = 1.0 - (state.timers.spawn / this.duration);
            render.visualScale = Math.pow(progress, 2);
        }

        return NodeState.RUNNING;
    }

    // Done spawning
    if (state.current === 'SPAWN') {
        state.current = 'ACTIVE';
        if (render) render.visualScale = 1.0;
    }

    return NodeState.SUCCESS;
  }
}
