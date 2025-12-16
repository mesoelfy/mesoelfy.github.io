import { Entity } from '@/core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/game/data/TransformData';
import { AIStateData } from '@/game/data/AIStateData';
import { TargetData } from '@/game/data/TargetData';
import { OrbitalData } from '@/game/data/OrbitalData';
import { RenderData } from '@/game/data/RenderData';
import { ComponentType } from '@/core/ecs/ComponentType';

const getPos = (e: Entity) => e.requireComponent<TransformData>(ComponentType.Transform);
const getState = (e: Entity) => e.requireComponent<AIStateData>(ComponentType.State);
const getTarget = (e: Entity) => e.requireComponent<TargetData>(ComponentType.Target);
const getOrbital = (e: Entity) => e.requireComponent<OrbitalData>(ComponentType.Orbital);
const getRender = (e: Entity) => e.requireComponent<RenderData>(ComponentType.Render);

// Rotation Smoothing
const TURN_SPEED = 5.0;

export const DaemonLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const state = getState(e);
    const target = getTarget(e);
    const orbital = getOrbital(e);
    const render = getRender(e);

    // --- 1. INITIALIZATION ---
    if (state.current === 'SPAWN' || state.current === 'IDLE') {
        state.current = 'ORBIT';
        state.data.chargeProgress = 0;
        state.data.lastFireTime = -10.0; // Ready to fire eventually
    }

    // --- 2. STATE MACHINE ---
    
    // >> ORBIT: Passive
    if (state.current === 'ORBIT') {
        orbital.active = true;
        // Start charging immediately
        state.current = 'CHARGING';
        state.data.chargeProgress = 0;
    }

    // >> CHARGING: Accumulate Power
    else if (state.current === 'CHARGING') {
        orbital.active = true;
        // Charge over 1.5 seconds
        state.data.chargeProgress += ctx.delta / 1.5; 
        
        if (state.data.chargeProgress >= 1.0) {
            state.data.chargeProgress = 1.0;
            state.current = 'READY';
            ctx.playSound('ui_optimal', pos.x);
        }
    }

    // >> READY: Tracking Target
    else if (state.current === 'READY') {
        orbital.active = true;
        if (target.id === 'ENEMY_LOCKED') {
            state.current = 'FIRE';
        }
    }

    // >> FIRE: Launch
    else if (state.current === 'FIRE') {
        orbital.active = false; // Stop moving to stabilize shot

        // Target Vector
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 1;
        const dirY = dist > 0 ? dy/dist : 0;

        // SPAWN THE PROJECTILE NOW
        const bullet = ctx.spawnProjectile(
            pos.x + (dirX * 0.5), 
            pos.y + (dirY * 0.5), 
            dirX * 35, 
            dirY * 35, 
            20, 
            'DAEMON_ORB', 
            e.id as number
        );

        ctx.spawnFX('IMPACT_WHITE', pos.x, pos.y);
        ctx.playSound('fx_teleport', pos.x);

        // Record timestamp for Renderer to trigger recoil
        state.data.lastFireTime = ctx.time;
        state.data.chargeProgress = 0;

        state.current = 'COOLDOWN';
        state.timers.action = 0.5; // Short cooldown
    }

    // >> COOLDOWN: Recover
    else if (state.current === 'COOLDOWN') {
        orbital.active = true;
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'ORBIT';
        }
    }

    // --- 3. AIMING ---
    let targetAngle = 0;
    
    if (state.current === 'FIRE' || state.current === 'READY') {
        // Face Enemy
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        targetAngle = Math.atan2(dy, dx);
    } else {
        // Face center (Player) roughly
        targetAngle = Math.atan2(-pos.y, -pos.x);
    }

    // Shortest angle interpolation
    let diff = targetAngle - pos.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    pos.rotation += diff * TURN_SPEED * ctx.delta;
    
    // Pass spin to renderer via visualRotation
    render.visualRotation += ctx.delta * 2.0;
  }
};
