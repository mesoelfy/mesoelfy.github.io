import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class SpawnPhase extends BTNode {
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const render = entity.getComponent<RenderData>(ComponentType.Render);
    
    if (!state) return NodeState.SUCCESS;

    if (state.timers.spawn === undefined) {
        state.timers.spawn = this.duration;
        state.current = 'SPAWN';
        if (render) {
            render.spawnProgress = 0.0;
            render.visualRotation = Math.random() * Math.PI * 2; // Random start angle
        }
    }

    if (state.timers.spawn > 0) {
        state.timers.spawn -= context.delta;
        
        if (render) {
            // Normalized Time (0.0 to 1.0)
            const t = 1.0 - (state.timers.spawn / this.duration);
            
            // 1. DISSOLVE PROGRESS (Linear is fine, InstancedActor curves the position)
            render.spawnProgress = Math.max(0, Math.min(1, t));
            
            // 2. ELASTIC SCALE POP
            // Grow 0 -> 1.0 -> 1.2 -> 1.0
            if (t < 0.8) {
                // Growth Phase
                render.visualScale = t / 0.8; 
            } else {
                // Elastic Snap Phase (0.8 to 1.0)
                const popT = (t - 0.8) / 0.2; // 0 to 1
                // Parabolic arc: Starts 1.0, peaks 1.2, ends 1.0
                // simple sine hump
                render.visualScale = 1.0 + (Math.sin(popT * Math.PI) * 0.25);
            }

            // 3. SPIN EFFECT
            // Fast spin that decays
            render.visualRotation += (1.0 - t) * 15.0 * context.delta;
        }

        return NodeState.RUNNING;
    }

    // COMPLETION
    if (state.current === 'SPAWN') {
        state.current = 'ACTIVE';
        if (render) {
            render.spawnProgress = 1.0;
            render.visualScale = 1.0;
            // IGNITION FLASH: Set flash to 0.6 (White-Hot) to signal "I'm ready"
            render.flash = 0.6; 
        }
    }

    return NodeState.SUCCESS;
  }
}
