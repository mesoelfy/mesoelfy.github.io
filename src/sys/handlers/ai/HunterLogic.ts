import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TargetData } from '@/sys/data/TargetData';
import { RenderData } from '@/sys/data/RenderData';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

const getPos = (e: Entity) => e.requireComponent<TransformData>(ComponentType.Transform);
const getMotion = (e: Entity) => e.requireComponent<MotionData>(ComponentType.Motion);
const getState = (e: Entity) => e.requireComponent<AIStateData>(ComponentType.State);
const getTarget = (e: Entity) => e.requireComponent<TargetData>(ComponentType.Target);
const getRender = (e: Entity) => e.requireComponent<RenderData>(ComponentType.Render);

function rotateTowards(current: number, target: number, speed: number): number {
    let diff = target - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * speed;
}

function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}

export const HunterLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    const state = getState(e);
    const target = getTarget(e);
    const render = getRender(e);

    const hunterConfig = ctx.config.enemies[EnemyTypes.HUNTER];
    const aiConfig = ctx.config.ai.HUNTER;

    // Initialize State Data
    if (state.data.spinVelocity === undefined) {
        state.data.spinVelocity = aiConfig.SPIN_SPEED_IDLE;
        state.data.spinAngle = 0;
    }
    
    if (state.current === 'SPAWN' || state.current === 'IDLE') {
        state.current = 'HUNT';
        state.timers.action = 3.0; 
        state.data.offsetAngle = (e.id.valueOf() % 10) * 0.6; 
    }

    let targetSpinSpeed = aiConfig.SPIN_SPEED_IDLE; 
    let spinLerpRate = ctx.delta * 2.0;

    const aimDx = target.x - pos.x;
    const aimDy = target.y - pos.y;
    const trueAngle = Math.atan2(aimDy, aimDx);

    // --- STATE MACHINE ---
    if (state.current === 'HUNT') {
        const currentAngle = (ctx.time * aiConfig.ORBIT_SPEED) + state.data.offsetAngle;
        const tx = target.x + Math.cos(currentAngle) * aiConfig.TARGET_RADIUS;
        const ty = target.y + Math.sin(currentAngle) * aiConfig.TARGET_RADIUS;

        const dx = tx - pos.x;
        const dy = ty - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = hunterConfig.baseSpeed; 
        
        if (dist > 1.0) {
            motion.vx += (dx / dist) * speed * ctx.delta * 2.0;
            motion.vy += (dy / dist) * speed * ctx.delta * 2.0;
        }
        motion.vx *= 0.92;
        motion.vy *= 0.92;

        pos.rotation = rotateTowards(pos.rotation, trueAngle, aiConfig.AIM_LERP);

        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGE';
            state.timers.action = hunterConfig.chargeDuration;
            motion.vx *= 0.1; 
            motion.vy *= 0.1;
        }
    } 
    else if (state.current === 'CHARGE') {
        state.timers.action -= ctx.delta;
        pos.rotation = rotateTowards(pos.rotation, trueAngle, aiConfig.CHARGE_LERP);

        const progress = 1.0 - (state.timers.action / hunterConfig.chargeDuration);
        const revCurve = Math.pow(progress, 3); 
        targetSpinSpeed = aiConfig.SPIN_SPEED_IDLE - (revCurve * 35.0); 
        spinLerpRate = ctx.delta * 10.0;

        if (state.timers.action <= 0) {
            state.current = 'FIRE';
        }
    }
    else if (state.current === 'FIRE') {
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        const offset = aiConfig.OFFSET_DIST;
        
        ctx.spawnProjectile(pos.x + (dirX * offset), pos.y + (dirY * offset), dirX * aiConfig.PROJECTILE_SPEED, dirY * aiConfig.PROJECTILE_SPEED);
        ctx.spawnLaunchSparks(pos.x + (dirX * offset), pos.y + (dirY * offset), pos.rotation);

        state.current = 'HUNT';
        state.timers.action = 2.0 + Math.random() * 2.0;
        state.data.spinVelocity = 50.0; 
    }

    // --- VISUAL UPDATES ---
    state.data.spinVelocity = lerp(state.data.spinVelocity, targetSpinSpeed, spinLerpRate);
    state.data.spinAngle += state.data.spinVelocity * ctx.delta;
    
    // PUSH TO RENDER COMPONENT
    render.visualRotation = state.data.spinAngle;
    render.visualScale = 1.0; 
  }
};
