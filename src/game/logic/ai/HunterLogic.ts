import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { ENEMY_CONFIG } from '../../config/EnemyConfig';
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

    // Initialization
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

    // --- STATE MACHINE ---

    if (state.current === 'HUNT') {
        const orbitSpeed = 0.5;
        const currentAngle = (ctx.time * orbitSpeed) + state.data.offsetAngle;
        
        // Orbit around TARGET (Player)
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
        
        motion.vx *= 0.92; // Damping for smooth movement
        motion.vy *= 0.92;

        // Face Target
        const aimDx = target.x - pos.x;
        const aimDy = target.y - pos.y;
        const aimAngle = Math.atan2(aimDy, aimDx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, aimAngle, 0.05);

        // Timer
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGE';
            state.timers.action = ENEMY_CONFIG[EnemyTypes.HUNTER].chargeDuration;
            motion.vx *= 0.1; // Brake
            motion.vy *= 0.1;
        }
    } 
    
    else if (state.current === 'CHARGE') {
        state.timers.action -= ctx.delta;
        motion.vx *= 0.8;
        motion.vy *= 0.8;

        // Hard lock aim on target
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const targetAngle = Math.atan2(dy, dx) - Math.PI/2;
        pos.rotation = rotateTowards(pos.rotation, targetAngle, 0.15);

        targetSpinSpeed = -8.0; // Visuals: Spin fast reverse

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
        
        const offset = 1.6;
        const spawnX = pos.x + (dirX * offset);
        const spawnY = pos.y + (dirY * offset);
        const SPEED = 25; 

        ctx.spawnProjectile(spawnX, spawnY, dirX * SPEED, dirY * SPEED);

        state.current = 'HUNT';
        state.timers.action = 2.0 + Math.random() * 2.0;
    }

    // Update Spin Data (Visuals)
    state.data.spinVelocity = lerp(state.data.spinVelocity, targetSpinSpeed, ctx.delta * 2.0);
    state.data.spinAngle += state.data.spinVelocity * ctx.delta;
  }
};
