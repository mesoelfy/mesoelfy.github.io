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
import { ENEMIES } from '@/engine/config/defs/Enemies';

export class DrillAttack extends BTNode {
  // Use a slightly larger offset to ensure visual overlap
  private readonly TIP_OFFSET = ENEMIES.driller.params?.spawnOffset || 0.32;
  
  constructor(private interval: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<any>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const combat = entity.getComponent<CombatData>(ComponentType.Combat);

    if (!target || !state || !transform) return NodeState.FAILURE;

    // TARGET LATCH LOGIC:
    // If we have a target panel, snap our destination to its edge
    let destX = target.x;
    let destY = target.y;
    
    // Force re-acquisition of panel rect if possible
    if (target.type === 'PANEL' && target.id) {
        const rect = context.getPanelRect(target.id as PanelId);
        if (rect) {
            // Find closest point on panel rect to current position
            destX = Math.max(rect.left, Math.min(transform.x, rect.right));
            destY = Math.max(rect.bottom, Math.min(transform.y, rect.top));
        } else {
            // Fallback: If registry empty (mobile init race), target 0,0 (center)
            // This explains the "aiming for center" bug if registry fails
        }
    }

    const dx = destX - transform.x;
    const dy = destY - transform.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Snap to position logic
    if (dist > 0.05) {
        // Still moving into position
        // This node usually runs AFTER MoveToTarget succeeds, so we should be close.
        // We gently lerp to the drill spot
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
        } else {
            state.timers[AITimerID.DRILL_DMG] = this.interval;
        }
    } else {
        state.timers[AITimerID.DRILL_DMG] -= context.delta;
    }
    return NodeState.RUNNING;
  }
}
