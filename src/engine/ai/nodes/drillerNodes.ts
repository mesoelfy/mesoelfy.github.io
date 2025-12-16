import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class DrillAttack extends BTNode {
  // Config matching original AI_CONFIG.DRILLER
  private readonly TIP_OFFSET = 0.4; 

  constructor(private damage: number, private interval: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<any>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);

    if (!target || !state || !transform) return NodeState.FAILURE;

    // 1. Resolve Latch Point (Where the drill tip touches)
    let destX = target.x;
    let destY = target.y;

    if (target.type === 'PANEL' && target.id) {
        const rect = context.getPanelRect(target.id);
        if (rect) {
            destX = Math.max(rect.left, Math.min(transform.x, rect.right));
            destY = Math.max(rect.bottom, Math.min(transform.y, rect.top));
        }
    }

    // 2. Physics Latch (Snap position)
    const dx = destX - transform.x;
    const dy = destY - transform.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Only snap if we have a valid vector, otherwise stay put
    if (dist > 0.001) {
        const normX = dx / dist;
        const normY = dy / dist;
        
        // Force position to be exactly at tip offset distance from latch point
        transform.x = destX - (normX * this.TIP_OFFSET);
        transform.y = destY - (normY * this.TIP_OFFSET);
        transform.rotation = angle;
    }

    // Stop momentum
    if (motion) {
        motion.vx = 0;
        motion.vy = 0;
    }

    // 3. Visuals (Sparks)
    context.spawnDrillSparks(destX, destY, transform.rotation);

    // 4. Audio
    if (!state.timers.drillAudio || state.timers.drillAudio <= 0) {
        context.playSound('loop_drill', transform.x);
        state.timers.drillAudio = 0.25;
    } else {
        state.timers.drillAudio -= context.delta;
    }

    // 5. Apply Damage
    if (!state.timers.drillDmg || state.timers.drillDmg <= 0) {
        if (target.type === 'PANEL' && target.id) {
            context.damagePanel(target.id, this.damage);
            state.timers.drillDmg = this.interval;
        } else {
            // Fallback for non-panel targets (e.g. Player)
            state.timers.drillDmg = this.interval;
        }
    } else {
        state.timers.drillDmg -= context.delta;
    }

    return NodeState.RUNNING;
  }
}
