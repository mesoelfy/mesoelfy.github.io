import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { EnemyTypes } from '../../config/Identifiers';

const getPos = (e: Entity) => e.requireComponent<TransformComponent>('Transform');
const getMotion = (e: Entity) => e.requireComponent<MotionComponent>('Motion');
const getState = (e: Entity) => e.requireComponent<StateComponent>('State');
const getTarget = (e: Entity) => e.requireComponent<TargetComponent>('Target');

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

    // USE INJECTED CONFIG
    const hunterConfig = ctx.config.enemies[EnemyTypes.HUNTER];
    const aiConfig = ctx.config.ai.HUNTER;

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

    // --- STATES ---

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

        const aimDx = target.x - pos.x;
        const aimDy = target.y - pos.y;
        const aimAngle = Math.atan2(aimDy, aimDx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, aimAngle, aiConfig.AIM_LERP);

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
        motion.vx *= 0.8;
        motion.vy *= 0.8;

        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const targetAngle = Math.atan2(dy, dx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, targetAngle, aiConfig.CHARGE_LERP);

        targetSpinSpeed = aiConfig.SPIN_SPEED_CHARGE; 

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
        
        const spawnX = pos.x + (dirX * offset);
        const spawnY = pos.y + (dirY * offset);

        ctx.spawnProjectile(spawnX, spawnY, dirX * aiConfig.PROJECTILE_SPEED, dirY * aiConfig.PROJECTILE_SPEED);
        ctx.spawnLaunchSparks(spawnX, spawnY, pos.rotation);

        state.current = 'HUNT';
        state.timers.action = 2.0 + Math.random() * 2.0;
    }

    state.data.spinVelocity = lerp(state.data.spinVelocity, targetSpinSpeed, ctx.delta * 2.0);
    state.data.spinAngle += state.data.spinVelocity * ctx.delta;
  }
};
