import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/sys/data/TransformData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TargetData } from '@/sys/data/TargetData';
import { OrbitalData } from '@/sys/data/OrbitalData';
import { RenderData } from '@/sys/data/RenderData';
import { OrdnanceData } from '@/sys/data/OrdnanceData';
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

export const DaemonLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const state = getState(e);
    const target = getTarget(e);
    const orbital = getOrbital(e);
    const render = getRender(e);

    const executeLevel = ctx.getUpgradeLevel('EXECUTE');
    const maxShield = 10 + executeLevel;

    if (typeof state.data.shieldHP !== 'number') state.data.shieldHP = 0;
    state.data.maxShield = maxShield; 

    if (typeof state.data.visualSpin !== 'number') state.data.visualSpin = 0;
    let targetSpeed = 1.0;
    
    // --- STATE HANDLERS ---

    if (state.current === 'SPAWN' || state.current === 'ORBIT') {
        state.current = 'CHARGING';
        state.data.shieldHP = 0; 
        
        // Spawn the Orb immediately
        // Use 'ORB' type for big glowy ball
        const orb = ctx.spawnProjectile(pos.x, pos.y, 0, 0, maxShield, 'ORB', e.id as number);
        const ord = orb.getComponent<OrdnanceData>(ComponentType.Ordnance);
        if (ord) ord.state = 'CHARGING';
        
        state.data.chargeId = orb.id;
    }

    // Helper to get Orb
    let orbEntity: Entity | undefined;
    if (state.data.chargeId) {
        orbEntity = ServiceLocator.getRegistry().getEntity(state.data.chargeId);
        if (!orbEntity || !orbEntity.active) {
            state.data.chargeId = null;
            orbEntity = undefined;
            // If orb died, go to cooldown
            if (state.current !== 'COOLDOWN' && state.current !== 'BROKEN') {
                state.current = 'BROKEN';
                state.timers.action = AI_CONFIG.DAEMON.RECOVERY_TIME;
            }
        }
    }

    if (state.current === 'CHARGING') {
        orbital.active = true;
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.CHARGING;
        
        const chargeRate = maxShield / AI_CONFIG.DAEMON.SHIELD_CHARGE_TIME; 
        state.data.shieldHP = Math.min(maxShield, state.data.shieldHP + (chargeRate * ctx.delta));
        
        // Sync Orb Scale
        if (orbEntity) {
            const r = orbEntity.getComponent<RenderData>(ComponentType.Render);
            const ratio = state.data.shieldHP / maxShield;
            if (r) r.visualScale = 1.0 + (ratio * 2.0); // Big growth
        }

        if (state.data.shieldHP >= maxShield) state.current = 'READY';
    } 
    else if (state.current === 'READY') {
        orbital.active = true;
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.READY;
        render.visualScale = 1.6 + Math.sin(ctx.time * 5) * 0.05;

        // Pulse Orb
        if (orbEntity) {
            const r = orbEntity.getComponent<RenderData>(ComponentType.Render);
            if (r) r.visualScale = 3.0 + Math.sin(ctx.time * 10) * 0.2;
        }

        if (target.id === 'ENEMY_LOCKED') {
             state.current = 'FIRE';
        }
    }
    else if (state.current === 'FIRE') {
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.FIRE;
        render.visualScale = 0.8; 

        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        pos.rotation = Math.atan2(dy, dx);

        // RELEASE ORB
        if (orbEntity) {
            const ord = orbEntity.getComponent<OrdnanceData>(ComponentType.Ordnance);
            const mot = orbEntity.getComponent<MotionData>(ComponentType.Motion);
            const tf = orbEntity.getComponent<TransformData>(ComponentType.Transform);
            
            if (ord && mot && tf) {
                ord.state = 'FLIGHT';
                mot.vx = dirX * 35;
                mot.vy = dirY * 35;
                tf.rotation = Math.atan2(dirY, dirX);
            }
            state.data.chargeId = null;
        }

        ctx.spawnFX('IMPACT_WHITE', pos.x, pos.y);

        state.data.shieldHP = 0; 
        state.current = 'COOLDOWN';
        state.timers.action = AI_CONFIG.DAEMON.COOLDOWN_TIME;
    }
    else if (state.current === 'COOLDOWN') {
        orbital.active = true;
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.COOLDOWN;
        render.visualScale = 1.0; 

        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            // Respawn Sequence handled by reset to CHARGING
            state.current = 'CHARGING';
            state.data.shieldHP = 0;
            // Spawn new orb
            const orb = ctx.spawnProjectile(pos.x, pos.y, 0, 0, maxShield, 'ORB', e.id as number);
            const ord = orb.getComponent<OrdnanceData>(ComponentType.Ordnance);
            if (ord) ord.state = 'CHARGING';
            state.data.chargeId = orb.id;
        }
    }
    else if (state.current === 'BROKEN') {
        state.data.shieldHP = 0;
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.BROKEN;
        render.visualScale = 0.7 + (Math.random() * 0.1); 

        state.timers.action -= ctx.delta;
        pos.rotation += ctx.delta * targetSpeed;

        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            // Spawn new orb
            const orb = ctx.spawnProjectile(pos.x, pos.y, 0, 0, maxShield, 'ORB', e.id as number);
            const ord = orb.getComponent<OrdnanceData>(ComponentType.Ordnance);
            if (ord) ord.state = 'CHARGING';
            state.data.chargeId = orb.id;
        }
    }

    if (typeof state.data.currentSpinSpeed !== 'number') state.data.currentSpinSpeed = 1.0;
    state.data.currentSpinSpeed = THREE.MathUtils.lerp(state.data.currentSpinSpeed, targetSpeed, ctx.delta * 5.0);
    state.data.visualSpin += state.data.currentSpinSpeed * ctx.delta;
    
    render.visualRotation = state.data.visualSpin;
  }
};
