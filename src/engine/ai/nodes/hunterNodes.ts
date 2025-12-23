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
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import * as THREE from 'three';

const IDLE_SPIN_TARGET = -2.5;  // CW
const CHARGE_SPIN_TARGET = 22.0; // CCW

export class RoamPanelZone extends BTNode {
  constructor(private speed: number, private padding: number) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);

    if (!transform || !motion || !state || !visual) return NodeState.FAILURE;

    // Reset State
    state.current = AI_STATE.ACTIVE;

    // Visual Spin (Idle)
    let currentVel = state.data.spinVel ?? IDLE_SPIN_TARGET;
    currentVel = THREE.MathUtils.lerp(currentVel, IDLE_SPIN_TARGET, context.delta * 3.0);
    state.data.spinVel = currentVel;
    visual.rotation += currentVel * context.delta;

    if (state.data.roamTargetX === undefined || state.data.roamTargetY === undefined) {
        const panels = context.getAllPanelRects();
        if (panels.length > 0) {
            const panel = panels[Math.floor(Math.random() * panels.length)];
            const halfW = (panel.width / 2) + this.padding;
            const halfH = (panel.height / 2) + this.padding;
            
            state.data.roamTargetX = panel.x + (Math.random() * 2 - 1) * halfW;
            state.data.roamTargetY = panel.y + (Math.random() * 2 - 1) * halfH;
        } else {
            state.data.roamTargetX = (Math.random() * 2 - 1) * 10;
            state.data.roamTargetY = (Math.random() * 2 - 1) * 5;
        }
    }

    const destX = state.data.roamTargetX!;
    const destY = state.data.roamTargetY!;

    const dx = destX - transform.x;
    const dy = destY - transform.y;
    const distSq = dx*dx + dy*dy;

    if (distSq < 1.0) {
        state.data.roamTargetX = undefined;
        state.data.roamTargetY = undefined;
        return NodeState.SUCCESS;
    }

    motion.vx += (dx - motion.vx) * context.delta * 2.0;
    motion.vy += (dy - motion.vy) * context.delta * 2.0;

    if (target && target.x !== undefined) {
        const tDx = target.x - transform.x;
        const tDy = target.y - transform.y;
        transform.rotation = Math.atan2(tDy, tDx);
    } else {
        transform.rotation = Math.atan2(motion.vy, motion.vx);
    }

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
    
    // --- SET STATE FOR VISUAL SYSTEM (SQUASH) ---
    state.current = AI_STATE.CHARGING;

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
        
        // Reset state after firing
        state.current = AI_STATE.ATTACK; 
        
        return NodeState.SUCCESS;
    }
    return NodeState.RUNNING;
  }
}
