import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { CombatData } from '@/engine/ecs/components/CombatData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { PanelId } from '@/engine/config/PanelConfig';
import { AITimerID } from '@/engine/ai/AITimerID';

export class DrillAttack extends BTNode {
  constructor(private interval: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<any>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const combat = entity.getComponent<CombatData>(ComponentType.Combat);

    if (!target || !state || !transform) return NodeState.FAILURE;

    // --- SAFETY CHECK: WAIT IF PANEL NOT FOUND ---
    let rect = undefined;
    if (target.type === 'PANEL' && target.id) {
        rect = context.getPanelRect(target.id as PanelId);
    }

    if (!rect) {
        // If we can't see the panel, idle in place (don't crash into center)
        if (motion) {
            motion.vx *= 0.9;
            motion.vy *= 0.9;
        }
        return NodeState.RUNNING;
    }

    // --- TARGET LATCH LOGIC ---
    // 1. Clamp X to horizontal bounds
    const destX = Math.max(rect.left, Math.min(transform.x, rect.right));
    
    // 2. Snap Y to CLOSEST EDGE (Top or Bottom)
    const distTop = Math.abs(transform.y - rect.top);
    const distBottom = Math.abs(transform.y - rect.bottom);
    const destY = distTop < distBottom ? rect.top : rect.bottom;

    const dx = destX - transform.x;
    const dy = destY - transform.y;
    const angle = Math.atan2(dy, dx);
    const distSq = dx*dx + dy*dy;
    
    // Snap to position if close enough (Drilling State)
    if (distSq > 0.01) {
        transform.x += dx * 0.1;
        transform.y += dy * 0.1;
        transform.rotation = angle;
    }

    if (motion) {
        motion.vx = 0;
        motion.vy = 0;
    }

    context.spawnFX('DRILL_SPARKS', destX, destY, transform.rotation);
    
    if (!state.timers[AITimerID.DRILL_AUDIO] || state.timers[AITimerID.DRILL_AUDIO] <= 0) {
        context.playSound('loop_drill', transform.x);
        state.timers[AITimerID.DRILL_AUDIO] = 0.25;
    } else {
        state.timers[AITimerID.DRILL_AUDIO] -= context.delta;
    }

    if (!state.timers[AITimerID.DRILL_DMG] || state.timers[AITimerID.DRILL_DMG] <= 0) {
        const damage = combat ? combat.damage : 1;
        if (target.type === 'PANEL' && target.id) {
            context.damagePanel(target.id as PanelId, damage, { 
                source: { x: transform.x, y: transform.y } 
            });
            state.timers[AITimerID.DRILL_DMG] = this.interval;
        }
    } else {
        state.timers[AITimerID.DRILL_DMG] -= context.delta;
    }
    
    return NodeState.RUNNING;
  }
}
