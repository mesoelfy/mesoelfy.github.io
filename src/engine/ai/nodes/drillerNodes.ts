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

// Visual offset to keep the body outside the panel
const DRILL_OFFSET = 0.35; 

export class DrillAttack extends BTNode {
  constructor(private interval: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const combat = entity.getComponent<CombatData>(ComponentType.Combat);

    if (!target || !state || !transform) return NodeState.FAILURE;

    // 1. Validate Target
    if (target.type !== 'PANEL' || !target.id) {
        // Lost target or invalid type
        state.data.drillTarget = undefined;
        return NodeState.FAILURE;
    }

    // 2. Validate Panel Existence
    const rect = context.getPanelRect(target.id as PanelId);
    if (!rect) {
        // Panel destroyed or missing
        state.data.drillTarget = undefined;
        return NodeState.FAILURE;
    }

    // 3. Initialize / Retrieve Lock
    // We lock onto a specific point on the panel edge to prevent "sliding"
    if (!state.data.drillTarget || state.data.drillTarget.panelId !== target.id) {
        
        // --- Calculate Closest Point on AABB ---
        // Clamp current position to the rectangle bounds
        const cx = Math.max(rect.left, Math.min(transform.x, rect.right));
        const cy = Math.max(rect.bottom, Math.min(transform.y, rect.top));

        // Determine which edge we are on (or closest to if inside)
        const dl = Math.abs(cx - rect.left);
        const dr = Math.abs(cx - rect.right);
        const dt = Math.abs(cy - rect.top);
        const db = Math.abs(cy - rect.bottom);
        
        const min = Math.min(dl, dr, dt, db);
        
        let latchX = cx;
        let latchY = cy;
        let angle = 0;

        // Snap to the specific edge
        if (min === dl) { latchX = rect.left; angle = 0; }          // Left Edge -> Face Right (0)
        else if (min === dr) { latchX = rect.right; angle = Math.PI; } // Right Edge -> Face Left (PI)
        else if (min === dt) { latchY = rect.top; angle = -Math.PI/2; } // Top Edge -> Face Down (-90)
        else { latchY = rect.bottom; angle = Math.PI/2; }           // Bottom Edge -> Face Up (90)

        // Save to blackboard
        state.data.drillTarget = {
            x: latchX,
            y: latchY,
            angle: angle,
            panelId: target.id
        };
    }

    const { x: latchX, y: latchY, angle: drillAngle } = state.data.drillTarget;

    // --- 4. Execution ---
    
    // Calculate final standing position (Tip at latch point, Body offset back)
    const standX = latchX - (Math.cos(drillAngle) * DRILL_OFFSET);
    const standY = latchY - (Math.sin(drillAngle) * DRILL_OFFSET);

    const dx = standX - transform.x;
    const dy = standY - transform.y;
    const distSq = dx*dx + dy*dy;

    // Movement Logic
    if (distSq > 0.01) {
        // Approaching
        const approachAngle = Math.atan2(dy, dx);
        transform.x += Math.cos(approachAngle) * 0.2;
        transform.y += Math.sin(approachAngle) * 0.2;
        
        // Smooth rotation blend
        if (distSq < 1.0) {
            let diff = drillAngle - transform.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            transform.rotation += diff * 0.25;
        } else {
            transform.rotation = approachAngle;
        }
    } else {
        // Arrived / Drilling
        transform.x = standX;
        transform.y = standY;
        transform.rotation = drillAngle;

        // Visuals & Damage
        context.spawnFX('DRILL_SPARKS', latchX, latchY, drillAngle);
        
        if (!state.timers[AITimerID.DRILL_AUDIO] || state.timers[AITimerID.DRILL_AUDIO] <= 0) {
            context.playSound('loop_drill', transform.x);
            state.timers[AITimerID.DRILL_AUDIO] = 0.25;
        } else {
            state.timers[AITimerID.DRILL_AUDIO] -= context.delta;
        }

        if (!state.timers[AITimerID.DRILL_DMG] || state.timers[AITimerID.DRILL_DMG] <= 0) {
            const damage = combat ? combat.damage : 1;
            context.damagePanel(target.id as PanelId, damage, { 
                source: { x: transform.x, y: transform.y } 
            });
            state.timers[AITimerID.DRILL_DMG] = this.interval;
        } else {
            state.timers[AITimerID.DRILL_DMG] -= context.delta;
        }
    }

    if (motion) {
        motion.vx = 0;
        motion.vy = 0;
    }

    return NodeState.RUNNING;
  }
}
