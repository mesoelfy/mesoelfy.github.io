import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { CombatData } from '@/engine/ecs/components/CombatData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { MODEL_CONFIG } from '@/engine/config/ModelConfig';
import { PanelId } from '@/engine/config/PanelConfig';

export class DrillAttack extends BTNode {
  private readonly TIP_OFFSET = MODEL_CONFIG.DRILLER.spawnOffset;

  constructor(private interval: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<any>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const combat = entity.getComponent<CombatData>(ComponentType.Combat);

    if (!target || !state || !transform) return NodeState.FAILURE;

    let destX = target.x;
    let destY = target.y;

    if (target.type === 'PANEL' && target.id) {
        const rect = context.getPanelRect(target.id as PanelId);
        if (rect) {
            destX = Math.max(rect.left, Math.min(transform.x, rect.right));
            destY = Math.max(rect.bottom, Math.min(transform.y, rect.top));
        }
    }

    const dx = destX - transform.x;
    const dy = destY - transform.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > 0.001) {
        const normX = dx / dist;
        const normY = dy / dist;
        
        transform.x = destX - (normX * this.TIP_OFFSET);
        transform.y = destY - (normY * this.TIP_OFFSET);
        transform.rotation = angle;
    }

    if (motion) {
        motion.vx = 0;
        motion.vy = 0;
    }

    context.spawnFX('DRILL_SPARKS', destX, destY, transform.rotation);

    if (!state.timers.drillAudio || state.timers.drillAudio <= 0) {
        context.playSound('loop_drill', transform.x);
        state.timers.drillAudio = 0.25;
    } else {
        state.timers.drillAudio -= context.delta;
    }

    if (!state.timers.drillDmg || state.timers.drillDmg <= 0) {
        const damage = combat ? combat.damage : 1;
        
        if (target.type === 'PANEL' && target.id) {
            context.damagePanel(target.id as PanelId, damage, { 
                source: { x: transform.x, y: transform.y } 
            });
            state.timers.drillDmg = this.interval;
        } else {
            state.timers.drillDmg = this.interval;
        }
    } else {
        state.timers.drillDmg -= context.delta;
    }

    return NodeState.RUNNING;
  }
}
