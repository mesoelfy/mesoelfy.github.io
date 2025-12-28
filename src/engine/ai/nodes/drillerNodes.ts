import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { CombatData } from '@/engine/ecs/components/CombatData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { PanelId } from '@/engine/config/PanelConfig';
import { AITimerID } from '@/engine/ai/AITimerID';
import { getNearestPointOnRect } from '@/engine/math/GeometryUtils';
import { EnemyType } from '@/engine/config/Identifiers';

export class DrillAttack extends BTNode {
  private readonly DETACH_THRESHOLD = 0.8;
  private readonly SPRING_STRENGTH = 12.0;
  
  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const combat = entity.getComponent<CombatData>(ComponentType.Combat);
    const identity = entity.getComponent<IdentityData>(ComponentType.Identity);

    if (!target || !state || !transform || !visual || !identity) return NodeState.FAILURE;
    
    // LOOKUP
    const params = context.config.enemies[identity.variant as EnemyType]?.params || {};
    const interval = params.drillInterval ?? 0.1;

    if (target.type !== 'PANEL' || !target.id) {
        state.data.drillTarget = undefined;
        return NodeState.FAILURE;
    }
    const rect = context.getPanelRect(target.id as PanelId);
    if (!rect) {
        state.data.drillTarget = undefined;
        return NodeState.FAILURE;
    }
    if (!state.data.drillTarget || state.data.drillTarget.panelId !== target.id) {
        const { x, y, angle } = getNearestPointOnRect(transform.x, transform.y, rect);
        state.data.drillTarget = { x, y, angle: angle + Math.PI, panelId: target.id };
    }
    const currentEdge = getNearestPointOnRect(state.data.drillTarget.x, state.data.drillTarget.y, rect);
    const driftSq = (currentEdge.x - state.data.drillTarget.x)**2 + (currentEdge.y - state.data.drillTarget.y)**2;
    if (driftSq > this.DETACH_THRESHOLD ** 2) {
        state.data.drillTarget = undefined;
        return NodeState.FAILURE; 
    }
    const { x: tX, y: tY, angle: tA } = state.data.drillTarget;
    const distSq = (tX - transform.x)**2 + (tY - transform.y)**2;
    if (distSq > 0.005) {
        transform.x += (tX - transform.x) * this.SPRING_STRENGTH * context.delta;
        transform.y += (tY - transform.y) * this.SPRING_STRENGTH * context.delta;
        let diff = tA - transform.rotation;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        transform.rotation += diff * 10.0 * context.delta;
    } else {
        transform.x = tX; transform.y = tY; transform.rotation = tA;
        const panelStress = context.getPanelStress(target.id as PanelId);
        if (panelStress > 0.1) {
            visual.offsetX = (Math.random() - 0.5) * panelStress * 0.15;
            visual.offsetY = (Math.random() - 0.5) * panelStress * 0.15;
        }
        
        // FIX: Offset sparks back along the reverse vector so they spawn on the drill bit, not inside the wall
        // tA points INTO the wall. tA + PI points OUT.
        const spawnOffset = 0.25; 
        const sparkX = tX + Math.cos(tA + Math.PI) * spawnOffset;
        const sparkY = tY + Math.sin(tA + Math.PI) * spawnOffset;
        
        context.spawnFX('DRILL_SPARKS', sparkX, sparkY, tA);
        
        this.handleAudio(state, transform.x, context);
        this.handleDamage(state, target.id as PanelId, transform, combat, context, interval);
    }
    if (motion) { motion.vx = 0; motion.vy = 0; }
    return NodeState.RUNNING;
  }
  private handleAudio(state: AIStateData, x: number, context: AIContext) {
      if (!state.timers[AITimerID.DRILL_AUDIO] || state.timers[AITimerID.DRILL_AUDIO] <= 0) {
          context.playSound('loop_drill', x);
          state.timers[AITimerID.DRILL_AUDIO] = 0.25;
      } else state.timers[AITimerID.DRILL_AUDIO]! -= context.delta;
  }
  private handleDamage(state: AIStateData, id: PanelId, t: TransformData, c: CombatData | undefined, ctx: AIContext, interval: number) {
      if (!state.timers[AITimerID.DRILL_DMG] || state.timers[AITimerID.DRILL_DMG] <= 0) {
          ctx.damagePanel(id, c ? c.damage : 1, { source: { x: t.x, y: t.y } });
          state.timers[AITimerID.DRILL_DMG] = interval;
      } else state.timers[AITimerID.DRILL_DMG]! -= ctx.delta;
  }
}
