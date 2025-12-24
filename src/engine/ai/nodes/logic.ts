import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { EnemyType } from '@/engine/config/Identifiers';

export class SpawnPhase extends BTNode {
  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const effect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const identity = entity.getComponent<IdentityData>(ComponentType.Identity);
    
    if (!state || !effect || !identity) return NodeState.FAILURE;

    // LOOKUP PARAM
    const type = identity.variant as EnemyType;
    const duration = context.config.enemies[type]?.params?.spawnDuration ?? 1.0;

    // 1. GATEKEEP
    if (state.current !== AI_STATE.IDLE && state.current !== AI_STATE.SPAWN) {
        if (effect.spawnProgress < 1.0) effect.spawnProgress = 1.0;
        return NodeState.SUCCESS;
    }

    // 2. KICKSTART
    if (state.current === AI_STATE.IDLE || (state.current === AI_STATE.SPAWN && effect.spawnVelocity === 0)) {
        state.current = AI_STATE.SPAWN;
        effect.spawnProgress = 0.0;
        effect.spawnVelocity = 1.0 / Math.max(0.1, duration);
    }

    // 3. FLAVOR
    if (transform && target && target.x !== 0 && target.y !== 0) {
        const dx = target.x - transform.x;
        const dy = target.y - transform.y;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
            const targetAngle = Math.atan2(dy, dx);
            let diff = targetAngle - transform.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            transform.rotation += diff * 5.0 * context.delta;
        }
    }

    // 4. CHECK COMPLETION
    if (effect.spawnProgress >= 1.0) {
        effect.spawnProgress = 1.0;
        effect.spawnVelocity = 0; 
        state.current = AI_STATE.ACTIVE;
        effect.flash = 0.5;
        return NodeState.SUCCESS;
    }

    return NodeState.RUNNING;
  }
}
