import { Entity } from '@/engine/ecs/Entity';
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

    const hunterConfig = ctx.config.enemies[EnemyTypes.HUNTER];
    const aiConfig = ctx.config.ai.HUNTER;

    // --- INITIALIZATION ---
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

    // --- AIMING LOGIC ---
    const aimDx = target.x - pos.x;
    const aimDy = target.y - pos.y;
    const trueAngle = Math.atan2(aimDy, aimDx); // Standard Math Angle (0 = Right)

    // --- STATE MACHINE ---

    // 1. HUNT: Orbit and Idle Spin
    if (state.current === 'HUNT') {
        const currentAngle = (ctx.time * aiConfig.ORBIT_SPEED) + state.data.offsetAngle;
        const tx = target.x + Math.cos(currentAngle) * aiConfig.TARGET_RADIUS;
        const ty = target.y + Math.sin(currentAngle) * aiConfig.TARGET_RADIUS;

        const dx = tx - pos.x;
        const dy = ty - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = hunterConfig.baseSpeed; 
        
        // Move towards orbit point
        if (dist > 1.0) {
            motion.vx += (dx / dist) * speed * ctx.delta * 2.0;
            motion.vy += (dy / dist) * speed * ctx.delta * 2.0;
        }
        motion.vx *= 0.92;
        motion.vy *= 0.92;

        // Lazy Aim
        pos.rotation = rotateTowards(pos.rotation, trueAngle, aiConfig.AIM_LERP);

        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGE';
            state.timers.action = hunterConfig.chargeDuration;
            // Stop moving to charge
            motion.vx *= 0.1; 
            motion.vy *= 0.1;
        }
    } 
    
    // 2. CHARGE: Rev up drill (Opposite Direction)
    else if (state.current === 'CHARGE') {
        state.timers.action -= ctx.delta;
        
        // Hard Aim
        pos.rotation = rotateTowards(pos.rotation, trueAngle, aiConfig.CHARGE_LERP);

        // Spin Ramp: Start slow, end fast (Negative direction)
        const progress = 1.0 - (state.timers.action / hunterConfig.chargeDuration);
        
        // Ramp function: 2.0 (Idle) -> -30.0 (Full Charge)
        // We use a curve to make it "rev up" at the end
        const revCurve = Math.pow(progress, 3); 
        targetSpinSpeed = aiConfig.SPIN_SPEED_IDLE - (revCurve * 35.0); 
        spinLerpRate = ctx.delta * 10.0; // Responsive

        if (state.timers.action <= 0) {
            state.current = 'FIRE';
        }
    }
    
    // 3. FIRE: Launch and Recoil
    else if (state.current === 'FIRE') {
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        
        const offset = aiConfig.OFFSET_DIST;
        
        const spawnX = pos.x + (dirX * offset);
        const spawnY = pos.y + (dirY * offset);

        // Calculate Damage from Config/Upgrade Context? For now standard.
        ctx.spawnProjectile(spawnX, spawnY, dirX * aiConfig.PROJECTILE_SPEED, dirY * aiConfig.PROJECTILE_SPEED);
        
        // Sparks: Pass True Angle (Visual Recoil handled by VFXSystem)
        ctx.spawnLaunchSparks(spawnX, spawnY, pos.rotation);

        state.current = 'HUNT';
        state.timers.action = 2.0 + Math.random() * 2.0;
        
        // SPRING OVERSHOOT: Kick spin to positive extreme (50) to "unwind" from the negative charge
        state.data.spinVelocity = 50.0; 
    }

    // --- APPLY SPIN PHYSICS ---
    state.data.spinVelocity = lerp(state.data.spinVelocity, targetSpinSpeed, spinLerpRate);
    state.data.spinAngle += state.data.spinVelocity * ctx.delta;
  }
};
