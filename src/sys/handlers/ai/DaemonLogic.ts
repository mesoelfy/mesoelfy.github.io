import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/sys/data/TransformData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TargetData } from '@/sys/data/TargetData';
import { OrbitalData } from '@/sys/data/OrbitalData';
import { RenderData } from '@/sys/data/RenderData';
import { ProjectileData } from '@/sys/data/ProjectileData';
import { MotionData } from '@/sys/data/MotionData';
import { AI_CONFIG } from '@/sys/config/AIConfig';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { ServiceLocator } from '@/sys/services/ServiceLocator';
import * as THREE from 'three';

const getPos = (e: Entity) => e.requireComponent<TransformData>(ComponentType.Transform);
const getState = (e: Entity) => e.requireComponent<AIStateData>(ComponentType.State);
const getTarget = (e: Entity) => e.requireComponent<TargetData>(ComponentType.Target);
const getOrbital = (e: Entity) => e.requireComponent<OrbitalData>(ComponentType.Orbital);
const getRender = (e: Entity) => e.requireComponent<RenderData>(ComponentType.Render);

// Physics Constants for Spring Animation
const TENSION = 200.0;
const DAMPING = 12.0;

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
        state.data.springVal = 0;
        state.data.springVel = 0;
        state.data.visualSpin = 0;
    }

    // --- 2. ORB MANAGEMENT ---
    let orbEntity: Entity | undefined;
    
    // Check if we have an active orb ID
    if (state.data.chargeId) {
        orbEntity = ServiceLocator.getRegistry().getEntity(state.data.chargeId);
        // If orb died unexpectedly
        if (!orbEntity || !orbEntity.active) {
            state.data.chargeId = null;
            orbEntity = undefined;
            if (state.current !== 'COOLDOWN' && state.current !== 'BROKEN') {
                state.current = 'BROKEN';
                state.timers.action = AI_CONFIG.DAEMON.RECOVERY_TIME;
            }
        } else {
            // STRICT POSYNC: Lock orb to daemon center
            const orbTrans = orbEntity.getComponent<TransformData>(ComponentType.Transform);
            if (orbTrans) {
                orbTrans.x = pos.x;
                orbTrans.y = pos.y;
                // orbTrans.scale is controlled by growth logic below
            }
        }
    }

    // --- 3. STATE LOGIC ---
    
    // >> ORBIT: Passive state, moves around player
    if (state.current === 'ORBIT') {
        orbital.active = true;
        
        // Transition to Charging
        if (!state.data.chargeId) {
            state.current = 'CHARGING';
            state.data.chargeProgress = 0;
            
            // Spawn new Orb
            const orb = ctx.spawnProjectile(pos.x, pos.y, 0, 0, 10, 'DAEMON_ORB', e.id as number);
            const proj = orb.getComponent<ProjectileData>(ComponentType.Projectile);
            if (proj) proj.state = 'CHARGING';
            
            // Init scale small
            const orbR = orb.getComponent<RenderData>(ComponentType.Render);
            if (orbR) orbR.visualScale = 0.1;
            
            state.data.chargeId = orb.id;
        }
    }

    // >> CHARGING: Growing the ball
    else if (state.current === 'CHARGING') {
        orbital.active = true;
        state.data.chargeProgress += ctx.delta / 2.0; // 2 seconds to charge
        
        if (orbEntity) {
            const r = orbEntity.getComponent<RenderData>(ComponentType.Render);
            if (r) {
                // Grow 0.1 -> 1.0
                r.visualScale = 0.1 + (Math.min(1.0, state.data.chargeProgress) * 0.9);
            }
        }

        if (state.data.chargeProgress >= 1.0) {
            state.current = 'READY';
        }
    }

    // >> READY: Charged, waiting for target lock
    else if (state.current === 'READY') {
        orbital.active = true;
        
        // Look at target if locked
        if (target.id === 'ENEMY_LOCKED') {
            state.current = 'FIRE';
        }
    }

    // >> FIRE: Launch logic
    else if (state.current === 'FIRE') {
        orbital.active = false; // Stop orbiting momentarily to stabilize shot

        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;

        // Trigger Spring Recoil (Squish)
        // We set velocity high, spring logic will oscillate it back
        state.data.springVel = -50.0; 

        // Launch Orb
        if (orbEntity) {
            const proj = orbEntity.getComponent<ProjectileData>(ComponentType.Projectile);
            const mot = orbEntity.getComponent<MotionData>(ComponentType.Motion);
            const tf = orbEntity.getComponent<TransformData>(ComponentType.Transform);
            
            if (proj && mot && tf) {
                proj.state = 'FLIGHT';
                mot.vx = dirX * 25;
                mot.vy = dirY * 25;
                
                // IMPORTANT: Stop updating position in this logic now that it's in flight
                state.data.chargeId = null; 
            }
        }

        ctx.spawnFX('IMPACT_WHITE', pos.x, pos.y);
        ctx.playSound('fx_teleport', pos.x);

        state.current = 'COOLDOWN';
        state.timers.action = 1.0;
    }

    // >> COOLDOWN: Recovering
    else if (state.current === 'COOLDOWN') {
        orbital.active = true;
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'ORBIT';
        }
    }

    // --- 4. SPRING ANIMATION (Squish/Stretch) ---
    // Simulate Hooke's Law for Y-scale
    const targetScale = 1.0;
    const currentScaleOffset = state.data.springVal || 0;
    
    // Force = -k * x - c * v
    const displacement = currentScaleOffset; // deviation from 0
    const force = -TENSION * displacement - DAMPING * state.data.springVel;
    
    state.data.springVel += force * ctx.delta;
    state.data.springVal += state.data.springVel * ctx.delta;

    // Apply to render
    // If springVal is negative (squish), Y shrinks, X/Z bulge
    // scaleY = 1 + springVal
    // scaleX = 1 - springVal * 0.5 (volume preservation approx)
    const sy = 1.0 + state.data.springVal;
    const sx = 1.0 - (state.data.springVal * 0.5);
    
    // Store these in RenderData for DaemonActor to read
    // We repurpose unused fields or just rely on DaemonActor reading AIState
    // But wait, RenderData handles uniform scale.
    // We need DAEMON_ACTOR to read this state directly.
    
    // --- 5. VISUAL SPIN ---
    // Spin only the cage, not the whole entity (unless aiming)
    state.data.visualSpin += ctx.delta * 2.0;
    render.visualRotation = state.data.visualSpin;
    
    // Face player or target
    // If NOT firing, face orbital parent (Player)
    if (state.current !== 'FIRE') {
        const pRect = ctx.getPanelRect('identity'); // Center (0,0) approx
        // Just look at (0,0)
        pos.rotation = Math.atan2(-pos.y, -pos.x);
    } else {
        // Look at target
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        pos.rotation = Math.atan2(dy, dx);
    }
  }
};
