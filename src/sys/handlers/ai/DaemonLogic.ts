import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/sys/data/TransformData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TargetData } from '@/sys/data/TargetData';
import { OrbitalData } from '@/sys/data/OrbitalData';
import { RenderData } from '@/sys/data/RenderData';
import { AI_CONFIG } from '@/sys/config/AIConfig';
import { ComponentType } from '@/engine/ecs/ComponentType';
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

    // --- VISUAL PHYSICS ---
    if (typeof state.data.visualSpin !== 'number') state.data.visualSpin = 0;
    let targetSpeed = 1.0;
    
    // State Transitions
    if (state.current === 'SPAWN' || state.current === 'ORBIT') {
        state.current = 'CHARGING';
        state.data.shieldHP = 0; 
    }

    if (state.current === 'CHARGING') {
        orbital.active = true;
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.CHARGING;
        
        const currentShield = state.data.shieldHP || 0;
        const ratio = Math.min(1.0, Math.max(0, currentShield / maxShield));
        render.visualScale = 1.0 + (ratio * 0.6);

        if (state.data.shieldHP <= 0 && state.data.wasHit) {
             state.current = 'BROKEN';
             state.timers.action = AI_CONFIG.DAEMON.RECOVERY_TIME;
        } else {
            const chargeRate = maxShield / AI_CONFIG.DAEMON.SHIELD_CHARGE_TIME; 
            state.data.shieldHP = Math.min(maxShield, state.data.shieldHP + (chargeRate * ctx.delta));
            if (state.data.shieldHP >= maxShield) state.current = 'READY';
        }
    } 
    else if (state.current === 'READY') {
        orbital.active = true;
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.READY;
        // Pulse Effect
        render.visualScale = 1.6 + Math.sin(ctx.time * 5) * 0.05;

        if (state.data.shieldHP <= 0) {
             state.current = 'BROKEN';
             state.timers.action = AI_CONFIG.DAEMON.RECOVERY_TIME;
        } else if (target.id === 'ENEMY_LOCKED') {
             state.current = 'FIRE';
        }
    }
    else if (state.current === 'FIRE') {
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.FIRE;
        render.visualScale = 0.8; // Squish

        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        pos.rotation = Math.atan2(dy, dx);

        ctx.spawnProjectile(pos.x, pos.y, dirX * 35, dirY * 35, maxShield);
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
            state.current = 'CHARGING';
            state.data.wasHit = false;
        }
    }
    else if (state.current === 'BROKEN') {
        state.data.shieldHP = 0;
        targetSpeed = AI_CONFIG.DAEMON.ROTATION_SPEED.BROKEN;
        render.visualScale = 0.7 + (Math.random() * 0.1); // Jitter

        state.timers.action -= ctx.delta;
        pos.rotation += ctx.delta * targetSpeed;

        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            state.data.wasHit = false;
        }
    }

    if (typeof state.data.currentSpinSpeed !== 'number') state.data.currentSpinSpeed = 1.0;
    state.data.currentSpinSpeed = THREE.MathUtils.lerp(state.data.currentSpinSpeed, targetSpeed, ctx.delta * 5.0);
    state.data.visualSpin += state.data.currentSpinSpeed * ctx.delta;
    
    render.visualRotation = state.data.visualSpin;
  }
};
