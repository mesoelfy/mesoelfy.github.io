import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TargetData } from '@/sys/data/TargetData';
import { RenderData } from '@/sys/data/RenderData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { ServiceLocator } from '@/sys/services/ServiceLocator';

const getPos = (e: Entity) => e.requireComponent<TransformData>(ComponentType.Transform);
const getMotion = (e: Entity) => e.requireComponent<MotionData>(ComponentType.Motion);
const getState = (e: Entity) => e.requireComponent<AIStateData>(ComponentType.State);
const getTarget = (e: Entity) => e.requireComponent<TargetData>(ComponentType.Target);
const getRender = (e: Entity) => e.requireComponent<RenderData>(ComponentType.Render);

export const HunterLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    const state = getState(e);
    const target = getTarget(e);
    const render = getRender(e);

    // Initialization
    if (state.current === 'SPAWN' || state.current === 'IDLE') {
        state.current = 'HOVER';
        state.timers.action = 2.0 + Math.random(); 
        state.data.driftX = (Math.random() - 0.5) * 4;
        state.data.driftY = (Math.random() - 0.5) * 4;
    }

    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angleToTarget = Math.atan2(dy, dx);

    // --- STATE MACHINE ---

    if (state.current === 'HOVER') {
        const tooClose = dist < 8.0;
        const tooFar = dist > 16.0;
        
        let tx = state.data.driftX;
        let ty = state.data.driftY;

        if (tooClose) { tx -= dx * 0.5; ty -= dy * 0.5; }
        if (tooFar)   { tx += dx * 0.5; ty += dy * 0.5; }

        motion.vx += (tx - motion.vx) * ctx.delta * 2.0;
        motion.vy += (ty - motion.vy) * ctx.delta * 2.0;

        pos.rotation = angleToTarget;

        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'LOCK';
            state.timers.action = 1.0; // 1s Lock time
            ctx.playSound('ui_chirp', pos.x);
        }
    }
    else if (state.current === 'LOCK') {
        motion.vx *= 0.9;
        motion.vy *= 0.9;
        pos.rotation = angleToTarget;
        
        // --- MARCHING ANTS LASER ---
        // Emit particles that move FAST along the vector. 
        // ParticleActor will stretch them into dashes.
        if (Math.random() > 0.2) { 
            const particleSys = ServiceLocator.getParticleSystem();
            
            // Spawn at hunter
            const px = pos.x + Math.cos(angleToTarget);
            const py = pos.y + Math.sin(angleToTarget);
            
            // Velocity towards player (High speed = Long Dash)
            const speed = 25.0; 
            const vx = Math.cos(angleToTarget) * speed;
            const vy = Math.sin(angleToTarget) * speed;
            
            // Color: Bright Yellow
            particleSys.spawn(px, py, '#F7D277', vx, vy, 0.4); 
        }

        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'FIRE';
        }
    }
    else if (state.current === 'FIRE') {
        const dirX = Math.cos(angleToTarget);
        const dirY = Math.sin(angleToTarget);
        const speed = 40.0;

        ctx.spawnProjectile(
            pos.x + dirX * 1.5, 
            pos.y + dirY * 1.5, 
            dirX * speed, 
            dirY * speed, 
            undefined, 
            'ENEMY_HUNTER', 
            e.id as number
        );

        ctx.playSound('fx_enemy_fire', pos.x);
        ctx.spawnLaunchSparks(pos.x + dirX, pos.y + dirY, angleToTarget);

        motion.vx = -dirX * 5.0;
        motion.vy = -dirY * 5.0;

        state.current = 'COOLDOWN';
        state.timers.action = 2.0;
    }
    else if (state.current === 'COOLDOWN') {
        motion.vx *= 0.95;
        motion.vy *= 0.95;
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'HOVER';
            state.timers.action = 2.0;
            state.data.driftX = (Math.random() - 0.5) * 4;
            state.data.driftY = (Math.random() - 0.5) * 4;
        }
    }

    render.visualScale = 1.0; 
    render.visualRotation = 0; 
  }
};
