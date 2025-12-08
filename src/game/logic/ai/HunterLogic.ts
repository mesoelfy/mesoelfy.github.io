import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { ENEMY_CONFIG } from '../../config/EnemyConfig';
import { EnemyTypes } from '../../config/Identifiers';
import { MODEL_CONFIG } from '../../config/ModelConfig';

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

    if (state.data.spinVelocity === undefined) {
        state.data.spinVelocity = 2.0;
        state.data.spinAngle = 0;
    }
    if (state.current === 'SPAWN' || state.current === 'IDLE') {
        state.current = 'HUNT';
        state.timers.action = 3.0; 
        state.data.offsetAngle = (e.id.valueOf() % 10) * 0.6; 
    }

    let targetSpinSpeed = 2.0; 

    // --- STATES ---

    if (state.current === 'HUNT') {
        // ... Orbit Logic ...
        const orbitSpeed = 0.5;
        const currentAngle = (ctx.time * orbitSpeed) + state.data.offsetAngle;
        const targetRadius = 10.0;
        const tx = target.x + Math.cos(currentAngle) * targetRadius;
        const ty = target.y + Math.sin(currentAngle) * targetRadius;

        const dx = tx - pos.x;
        const dy = ty - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = ENEMY_CONFIG[EnemyTypes.HUNTER].baseSpeed; 
        
        if (dist > 1.0) {
            motion.vx += (dx / dist) * speed * ctx.delta * 2.0;
            motion.vy += (dy / dist) * speed * ctx.delta * 2.0;
        }
        
        motion.vx *= 0.92;
        motion.vy *= 0.92;

        const aimDx = target.x - pos.x;
        const aimDy = target.y - pos.y;
        const aimAngle = Math.atan2(aimDy, aimDx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, aimAngle, 0.05);

        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGE';
            state.timers.action = ENEMY_CONFIG[EnemyTypes.HUNTER].chargeDuration;
            motion.vx *= 0.1; 
            motion.vy *= 0.1;
        }
    } 
    
    else if (state.current === 'CHARGE') {
        // Charging... (Renderer handles the growing orb visual)
        state.timers.action -= ctx.delta;
        motion.vx *= 0.8;
        motion.vy *= 0.8;

        // Hard Lock Aim
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const targetAngle = Math.atan2(dy, dx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, targetAngle, 0.15);

        targetSpinSpeed = -8.0; 

        if (state.timers.action <= 0) {
            state.current = 'FIRE';
        }
    }
    
    else if (state.current === 'FIRE') {
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Calculate Launch Direction
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        
        // TIP CALCULATION:
        // Hunter Scale = 2.0 (Config)
        // Local Tip Y is approx 0.8 (Geometry)
        // Global Offset = 1.6 units
        const offset = 1.6;
        
        const spawnX = pos.x + (dirX * offset);
        const spawnY = pos.y + (dirY * offset);
        const SPEED = 25; 

        // 1. Spawn Projectile
        ctx.spawnProjectile(spawnX, spawnY, dirX * SPEED, dirY * SPEED);
        
        // 2. Spawn Visual Recoil (Sparks)
        ctx.spawnLaunchSparks(spawnX, spawnY, pos.rotation);

        state.current = 'HUNT';
        state.timers.action = 2.0 + Math.random() * 2.0;
    }

    state.data.spinVelocity = lerp(state.data.spinVelocity, targetSpinSpeed, ctx.delta * 2.0);
    state.data.spinAngle += state.data.spinVelocity * ctx.delta;
  }
};
