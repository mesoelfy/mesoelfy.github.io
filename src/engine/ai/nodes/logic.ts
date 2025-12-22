import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AI_STATE } from '@/engine/ai/AIStateTypes';

export class SpawnPhase extends BTNode {
  // duration: How long the spawn animation takes in seconds
  constructor(private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    
    if (!state || !effect) return NodeState.FAILURE;

    // 1. GATEKEEP: If already active, we are done. Don't run logic.
    if (state.current !== AI_STATE.IDLE && state.current !== AI_STATE.SPAWN) {
        // Safety: Ensure we are fully visible if we skipped logic somehow
        if (effect.spawnProgress < 1.0) effect.spawnProgress = 1.0;
        return NodeState.SUCCESS;
    }

    // 2. KICKSTART: If just created (IDLE) or stuck in SPAWN without velocity
    if (state.current === AI_STATE.IDLE || (state.current === AI_STATE.SPAWN && effect.spawnVelocity === 0)) {
        state.current = AI_STATE.SPAWN;
        effect.spawnProgress = 0.0;
        // Velocity = 100% / duration in seconds
        effect.spawnVelocity = 1.0 / Math.max(0.1, this.duration);
    }

    // 3. FLAVOR: Face Target while spawning (Tactical look)
    if (transform && target && target.x !== 0 && target.y !== 0) {
        const dx = target.x - transform.x;
        const dy = target.y - transform.y;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
            const targetAngle = Math.atan2(dy, dx);
            // Smooth turn towards target
            let diff = targetAngle - transform.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            transform.rotation += diff * 5.0 * context.delta;
        }
    }

    // 4. CHECK COMPLETION
    // The VisualSystem increments spawnProgress using the velocity we set above.
    if (effect.spawnProgress >= 1.0) {
        effect.spawnProgress = 1.0;
        effect.spawnVelocity = 0; // Stop animating
        state.current = AI_STATE.ACTIVE;
        
        // Optional: Trigger a subtle pop flash
        effect.flash = 0.5;
        
        return NodeState.SUCCESS;
    }

    return NodeState.RUNNING;
  }
}
