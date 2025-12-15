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
    if (typeof state.data.visualSpin !== 'number') state.data.visualSpin = 0;
    
    // --- SPAWN SEQUENCE ---
    if (state.current === 'SPAWN' || state.current === 'ORBIT') {
        state.current = 'CHARGING';
        state.data.shieldHP = 0; 
        
        const orb = ctx.spawnProjectile(pos.x, pos.y, 0, 0, maxShield, 'DAEMON_ORB', e.id as number);
        const proj = orb.getComponent<ProjectileData>(ComponentType.Projectile);
        if (proj) proj.state = 'CHARGING';
        state.data.chargeId = orb.id;
    }

    // Retrieve held orb
    let orbEntity: Entity | undefined;
    if (state.data.chargeId) {
        orbEntity = ServiceLocator.getRegistry().getEntity(state.data.chargeId);
        if (!orbEntity || !orbEntity.active) {
            state.data.chargeId = null;
            orbEntity = undefined;
            if (state.current !== 'COOLDOWN' && state.current !== 'BROKEN') {
                state.current = 'BROKEN';
                state.timers.action = AI_CONFIG.DAEMON.RECOVERY_TIME;
            }
        }
    }

    let targetSpin = 1.0;

    // --- STATE MACHINE ---
    if (state.current === 'CHARGING') {
        orbital.active = true;
        targetSpin = AI_CONFIG.DAEMON.ROTATION_SPEED.CHARGING;
        
        const chargeRate = maxShield / AI_CONFIG.DAEMON.SHIELD_CHARGE_TIME; 
        state.data.shieldHP = Math.min(maxShield, state.data.shieldHP + (chargeRate * ctx.delta));
        
        if (orbEntity) {
            const r = orbEntity.getComponent<RenderData>(ComponentType.Render);
            if (r) {
                // Scale from 0.1 to 1.2
                const progress = state.data.shieldHP / maxShield;
                r.visualScale = 0.1 + (progress * 1.1); 
            }
        }

        if (state.data.shieldHP >= maxShield) state.current = 'READY';
        
        // Face player while charging
        const pRect = ctx.getPanelRect('identity'); // Or just face center
        if (pRect) pos.rotation = Math.atan2(pRect.y - pos.y, pRect.x - pos.x);
    } 
    else if (state.current === 'READY') {
        orbital.active = true;
        targetSpin = AI_CONFIG.DAEMON.ROTATION_SPEED.READY;
        render.visualScale = 1.2;

        // Face Target
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        pos.rotation = Math.atan2(dy, dx);

        if (target.id === 'ENEMY_LOCKED') {
             state.current = 'FIRE';
        }
    }
    else if (state.current === 'FIRE') {
        targetSpin = 30.0; // High speed spin during fire
        
        // Note: Squish is handled in DaemonActor based on 'FIRE' state
        
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        
        pos.rotation = Math.atan2(dy, dx);

        // RELEASE ORB
        if (orbEntity) {
            const proj = orbEntity.getComponent<ProjectileData>(ComponentType.Projectile);
            const mot = orbEntity.getComponent<MotionData>(ComponentType.Motion);
            const tf = orbEntity.getComponent<TransformData>(ComponentType.Transform);
            const r = orbEntity.getComponent<RenderData>(ComponentType.Render);
            
            if (proj && mot && tf) {
                proj.state = 'FLIGHT';
                mot.vx = dirX * 25; 
                mot.vy = dirY * 25;
                tf.rotation = Math.atan2(dirY, dirX);
                
                // Keep it big when fired
                if (r) r.visualScale = 1.2;
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
        targetSpin = -2.0; // Slow unwind
        render.visualScale = 1.0; 

        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            state.data.shieldHP = 0;
            const orb = ctx.spawnProjectile(pos.x, pos.y, 0, 0, maxShield, 'DAEMON_ORB', e.id as number);
            const proj = orb.getComponent<ProjectileData>(ComponentType.Projectile);
            if (proj) proj.state = 'CHARGING';
            state.data.chargeId = orb.id;
        }
    }
    else if (state.current === 'BROKEN') {
        state.data.shieldHP = 0;
        targetSpin = 0; // Dead
        
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            const orb = ctx.spawnProjectile(pos.x, pos.y, 0, 0, maxShield, 'DAEMON_ORB', e.id as number);
            const proj = orb.getComponent<ProjectileData>(ComponentType.Projectile);
            if (proj) proj.state = 'CHARGING';
            state.data.chargeId = orb.id;
        }
    }

    state.data.visualSpin += targetSpin * ctx.delta;
    
    // NOTE: DaemonActor uses render.visualRotation for visual spin around Local Y
    // pos.rotation is for World Facing. They are distinct.
    render.visualRotation = state.data.visualSpin;
  }
};
