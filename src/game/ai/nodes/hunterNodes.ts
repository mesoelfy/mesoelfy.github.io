import { BTNode, NodeState } from '@/core/ai/behavior/types';
import { Entity } from '@/core/ecs/Entity';
import { AIContext } from '@/game/handlers/ai/types';
import { TransformData } from '@/game/data/TransformData';
import { MotionData } from '@/game/data/MotionData';
import { TargetData } from '@/game/data/TargetData';
import { AIStateData } from '@/game/data/AIStateData';
import { ComponentType } from '@/core/ecs/ComponentType';

export class HoverDrift extends BTNode {
  constructor(private minRange: number, private maxRange: number, private duration: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);

    if (!transform || !motion || !target || !state) return NodeState.FAILURE;

    // Fix: Ensure undefined properties are handled
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
    
    // SAFETY: Prevent NaN
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
    if (!transform) return NodeState.FAILURE;

    // Config for Continuous Stream
    const rearAngle = transform.rotation + Math.PI;
    const offset = 0.5;
    const spreadAngle = 0.2; 
    
    // Multiple particles per tick for dense trail
    const density = 2; 

    for (let i = 0; i < density; i++) {
        const spread = (Math.random() - 0.5) * spreadAngle;
        const angle = rearAngle + spread;
        const speed = 15.0 + (Math.random() * 10.0);
        
        const px = transform.x + Math.cos(rearAngle) * offset;
        const py = transform.y + Math.sin(rearAngle) * offset;
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // Shape 1 = Teardrop
        context.spawnParticle(px, py, '#F7D277', vx, vy, 0.3 + (Math.random() * 0.2), 1.0);
    }

    return NodeState.SUCCESS;
  }
}
