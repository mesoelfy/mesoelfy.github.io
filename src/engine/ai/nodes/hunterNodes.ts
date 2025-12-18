import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { ComponentType } from '@/engine/ecs/ComponentType';

export class HoverDrift extends BTNode {
  constructor(private minRange: number, private maxRange: number, private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);

    if (!transform || !motion || !target || !state) return NodeState.FAILURE;

    // --- STUN LOGIC ---
    if (state.stunTimer > 0) {
        state.stunTimer -= context.delta;
        return NodeState.RUNNING;
    }

    if (!state.timers) state.timers = {};
    if (!state.data) state.data = {};

    if (!state.timers.hover) {
        state.timers.hover = this.duration;
        state.data.driftX = (Math.random() - 0.5) * 4;
        state.data.driftY = (Math.random() - 0.5) * 4;
    }

    state.timers.hover -= context.delta;
    if (state.timers.hover <= 0) {
        state.timers.hover = undefined;
        return NodeState.SUCCESS;
    }

    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    const distSq = dx*dx + dy*dy;
    const dist = Math.sqrt(distSq);
    
    if (dist < 0.001) {
        motion.vx *= 0.9;
        motion.vy *= 0.9;
        return NodeState.RUNNING;
    }

    const angleToTarget = Math.atan2(dy, dx);

    let tx = state.data.driftX || 0;
    let ty = state.data.driftY || 0;

    if (dist < this.minRange) {
        tx -= dx * 0.5; 
        ty -= dy * 0.5;
    } else if (dist > this.maxRange) {
        tx += dx * 0.5; 
        ty += dy * 0.5;
    }

    motion.vx += (tx - motion.vx) * context.delta * 2.0;
    motion.vy += (ty - motion.vy) * context.delta * 2.0;
    
    transform.rotation = angleToTarget;

    return NodeState.RUNNING;
  }
}

export class FaceTarget extends BTNode {
  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);

    if (!transform || !target) return NodeState.FAILURE;

    // We let them rotate even if stunned? 
    // No, freeze rotation too for "Impact Feel"
    // But since FaceTarget sets Success instantly, we skip this logic for now or implement rotation logic elsewhere.
    // For now, let's keep rotation active during stun to prevent weird snapping.

    if (motion) {
        motion.vx *= 0.9;
        motion.vy *= 0.9;
    }

    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    transform.rotation = Math.atan2(dy, dx);

    return NodeState.SUCCESS;
  }
}

export class FireProjectile extends BTNode {
  constructor(private speed: number, private configId: string) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    
    if (!transform) return NodeState.FAILURE;

    const dirX = Math.cos(transform.rotation);
    const dirY = Math.sin(transform.rotation);

    context.spawnProjectile(
        transform.x + dirX * 1.5, 
        transform.y + dirY * 1.5, 
        dirX * this.speed, 
        dirY * this.speed, 
        undefined, 
        this.configId, 
        entity.id as number
    );

    context.playSound('fx_enemy_fire', transform.x);
    
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    if (motion) {
        motion.vx = -dirX * 5.0;
        motion.vy = -dirY * 5.0;
    }

    context.spawnLaunchSparks(transform.x + dirX, transform.y + dirY, transform.rotation);

    return NodeState.SUCCESS;
  }
}

export class ExhaustFX extends BTNode {
  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    if (!transform || !state) return NodeState.FAILURE;

    if (!state.timers.sizzle || state.timers.sizzle <= 0) {
        context.playSound('fx_exhaust_sizzle', transform.x);
        state.timers.sizzle = 0.15;
    } else {
        state.timers.sizzle -= context.delta;
    }

    const rearAngle = transform.rotation + Math.PI;
    const offset = 0.5;
    const spreadAngle = 0.2; 
    const density = 2; 

    for (let i = 0; i < density; i++) {
        const spread = (Math.random() - 0.5) * spreadAngle;
        const angle = rearAngle + spread;
        const speed = 15.0 + (Math.random() * 10.0);
        
        const px = transform.x + Math.cos(rearAngle) * offset;
        const py = transform.y + Math.sin(rearAngle) * offset;
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        context.spawnParticle(px, py, '#F7D277', vx, vy, 0.3 + (Math.random() * 0.2), 1.0);
    }

    return NodeState.SUCCESS;
  }
}
