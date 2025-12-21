import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AITimerID } from '@/engine/ai/AITimerID';
import * as THREE from 'three';

const IDLE_SPIN_TARGET = -2.5;  // CW
const CHARGE_SPIN_TARGET = 22.0; // CCW

export class HoverDrift extends BTNode {
  private minDur: number;
  private maxDur: number;
  constructor(private minRange: number, private maxRange: number, minDuration: number, maxDuration?: number) { 
      super();
      this.minDur = minDuration;
      this.maxDur = maxDuration ?? minDuration;
  }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const state = entity.getComponent<AIStateData>(ComponentType.State);

    if (!transform || !motion || !target || !state || !visual) return NodeState.FAILURE;
    
    let currentVel = state.data.spinVel ?? IDLE_SPIN_TARGET;
    currentVel = THREE.MathUtils.lerp(currentVel, IDLE_SPIN_TARGET, context.delta * 3.0);
    state.data.spinVel = currentVel;
    visual.rotation += currentVel * context.delta;

    if (state.stunTimer > 0) {
        state.stunTimer -= context.delta;
        return NodeState.RUNNING;
    }

    if (!state.timers[AITimerID.HOVER]) {
        state.timers[AITimerID.HOVER] = this.minDur + Math.random() * (this.maxDur - this.minDur);
        state.data.driftX = (Math.random() - 0.5) * 4;
        state.data.driftY = (Math.random() - 0.5) * 4;
    }

    state.timers[AITimerID.HOVER]! -= context.delta;
    if (state.timers[AITimerID.HOVER]! <= 0) {
        state.timers[AITimerID.HOVER] = undefined;
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

export class AimAndFire extends BTNode {
  constructor(private aimDuration: number, private projectileSpeed: number, private configId: string) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const state = entity.getComponent<AIStateData>(ComponentType.State);

    if (!transform || !target || !state || !visual) return NodeState.FAILURE;
    
    let currentVel = state.data.spinVel ?? IDLE_SPIN_TARGET;
    currentVel = THREE.MathUtils.lerp(currentVel, CHARGE_SPIN_TARGET, context.delta * 2.5);
    state.data.spinVel = currentVel;
    visual.rotation += currentVel * context.delta;

    if (state.timers[AITimerID.AIM] === undefined) {
        state.timers[AITimerID.AIM] = this.aimDuration;
    }

    if (motion) {
        motion.vx *= 0.8;
        motion.vy *= 0.8;
    }

    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    transform.rotation = Math.atan2(dy, dx);

    if (!state.timers[AITimerID.SIZZLE] || state.timers[AITimerID.SIZZLE]! <= 0) {
        context.playSound('fx_exhaust_sizzle', transform.x);
        state.timers[AITimerID.SIZZLE] = 0.15;
    } else {
        state.timers[AITimerID.SIZZLE]! -= context.delta;
    }

    const rearAngle = transform.rotation + Math.PI;
    // OFFSET_TWEAK: 1.6 -> 1.3
    const offset = 1.3;
    const spreadAngle = 0.25; 
    const density = 2; 

    for (let i = 0; i < density; i++) {
        const spread = (Math.random() - 0.5) * spreadAngle;
        const angle = rearAngle + spread;
        const speed = 12.0 + (Math.random() * 8.0);
        const px = transform.x + Math.cos(rearAngle) * offset;
        const py = transform.y + Math.sin(rearAngle) * offset;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        context.spawnParticle(px, py, '#F7D277', vx, vy, 0.2 + (Math.random() * 0.3), 0.8, 1);
    }

    state.timers[AITimerID.AIM]! -= context.delta;
    if (state.timers[AITimerID.AIM]! <= 0) {
        state.timers[AITimerID.AIM] = undefined; 
        const dirX = Math.cos(transform.rotation);
        const dirY = Math.sin(transform.rotation);

        context.spawnProjectile(
            transform.x + dirX * 1.5, 
            transform.y + dirY * 1.5, 
            dirX * this.projectileSpeed, 
            dirY * this.projectileSpeed, 
            undefined, 
            this.configId, 
            entity.id as number
        );

        context.playSound('fx_enemy_fire', transform.x);
        if (motion) {
            motion.vx = -dirX * 5.0;
            motion.vy = -dirY * 5.0;
        }

        context.spawnFX('HUNTER_RECOIL', transform.x + dirX, transform.y + dirY, transform.rotation);
        return NodeState.SUCCESS;
    }
    return NodeState.RUNNING;
  }
}
