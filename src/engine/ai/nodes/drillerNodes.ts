import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { CombatData } from '@/engine/ecs/components/CombatData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { PanelId } from '@/engine/config/PanelConfig';
import { AITimerID } from '@/engine/ai/AITimerID';
import { getNearestPointOnRect } from '@/engine/math/GeometryUtils';

export class DrillAttack extends BTNode {
  // Latch tolerance: How far the wall can move before we let go (World Units)
  private readonly DETACH_THRESHOLD = 0.5;

  constructor(private interval: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const combat = entity.getComponent<CombatData>(ComponentType.Combat);

    if (!target || !state || !transform) return NodeState.FAILURE;

    // 1. Validate Target Panel Existence
    if (target.type !== 'PANEL' || !target.id) {
        state.data.drillTarget = undefined;
        return NodeState.FAILURE;
    }

    const rect = context.getPanelRect(target.id as PanelId);
    if (!rect) {
        state.data.drillTarget = undefined;
        return NodeState.FAILURE;
    }

    // 2. Validate Latch Integrity (Handle Resize)
    if (state.data.drillTarget) {
        // Check if our current target point is still on the panel edge
        const { x, y } = state.data.drillTarget;
        
        // Calculate where the edge is NOW
        const currentEdge = getNearestPointOnRect(x, y, rect);
        const driftSq = (currentEdge.x - x)**2 + (currentEdge.y - y)**2;

        // If the wall moved away significantly, break lock
        if (driftSq > this.DETACH_THRESHOLD * this.DETACH_THRESHOLD) {
            state.data.drillTarget = undefined;
            // Returning FAILURE causes the Selector to fall back to 'MoveToTarget',
            // which naturally handles re-pathing to the new edge.
            return NodeState.FAILURE;
        }
    }

    // 3. Acquire Latch Point (If missing)
    if (!state.data.drillTarget || state.data.drillTarget.panelId !== target.id) {
        const { x, y, angle } = getNearestPointOnRect(transform.x, transform.y, rect);
        
        // Align drill rotation to face INTO the wall (+X geometry)
        state.data.drillTarget = {
            x,
            y,
            angle: angle + Math.PI, 
            panelId: target.id
        };
    }

    const { x: targetX, y: targetY, angle: targetAngle } = state.data.drillTarget;

    // 4. Execution Logic
    const dx = targetX - transform.x;
    const dy = targetY - transform.y;
    const distSq = dx*dx + dy*dy;

    if (distSq > 0.01) {
        // --- APPROACHING ---
        const approachAngle = Math.atan2(dy, dx);
        
        // Lerp towards latch point
        transform.x += (targetX - transform.x) * 5.0 * context.delta;
        transform.y += (targetY - transform.y) * 5.0 * context.delta;
        
        // Rotate towards movement direction
        transform.rotation = approachAngle;
    } else {
        // --- LATCHED & DRILLING ---
        
        // Snap to exact edge
        transform.x = targetX;
        transform.y = targetY;
        
        // Face into wall
        transform.rotation = targetAngle;

        // VFX & SFX
        context.spawnFX('DRILL_SPARKS', targetX, targetY, targetAngle);
        
        this.handleAudio(state, transform.x, context);
        this.handleDamage(state, target.id as PanelId, transform, combat, context);
    }

    // Kill physics velocity while controlled by logic
    if (motion) {
        motion.vx = 0;
        motion.vy = 0;
    }

    return NodeState.RUNNING;
  }

  private handleAudio(state: AIStateData, x: number, context: AIContext) {
      if (!state.timers[AITimerID.DRILL_AUDIO] || state.timers[AITimerID.DRILL_AUDIO] <= 0) {
          context.playSound('loop_drill', x);
          // Audio loop matches damage frequency roughly for sync feel
          state.timers[AITimerID.DRILL_AUDIO] = 0.25;
      } else {
          state.timers[AITimerID.DRILL_AUDIO] -= context.delta;
      }
  }

  private handleDamage(
      state: AIStateData, 
      panelId: PanelId, 
      transform: TransformData, 
      combat: CombatData | undefined, 
      context: AIContext
  ) {
      if (!state.timers[AITimerID.DRILL_DMG] || state.timers[AITimerID.DRILL_DMG] <= 0) {
          const damage = combat ? combat.damage : 1;
          
          context.damagePanel(panelId, damage, { 
              source: { x: transform.x, y: transform.y } 
          });
          
          // Reset timer
          state.timers[AITimerID.DRILL_DMG] = this.interval;
      } else {
          state.timers[AITimerID.DRILL_DMG] -= context.delta;
      }
  }
}
