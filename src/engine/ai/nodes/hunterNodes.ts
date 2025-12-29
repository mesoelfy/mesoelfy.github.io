import { BTNode, NodeState } from '@/engine/ai/behavior/types';
import { Entity } from '@/engine/ecs/Entity';
import { AIContext } from '@/engine/handlers/ai/types';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { TargetData } from '@/engine/ecs/components/TargetData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { RenderTransform } from '@/engine/ecs/components/RenderTransform';
import { RenderEffect } from '@/engine/ecs/components/RenderEffect';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { ProjectileData } from '@/engine/ecs/components/ProjectileData';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { AITimerID } from '@/engine/ai/AITimerID';
import { AI_STATE } from '@/engine/ai/AIStateTypes';
import { EnemyType } from '@/engine/config/Identifiers';
import * as THREE from 'three';

const IDLE_SPIN_TARGET = -2.5;  // CW
const CHARGE_SPIN_TARGET = 22.0; // CCW

export class RoamPanelZone extends BTNode {
  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const identity = entity.getComponent<IdentityData>(ComponentType.Identity);

    if (!transform || !motion || !state || !visual || !identity) return NodeState.FAILURE;

    // LOOKUP
    const params = context.config.enemies[identity.variant as EnemyType]?.params || {};
    const padding = params.roamPadding ?? 1.0;

    state.current = AI_STATE.ACTIVE;

    let currentVel = state.data.spinVel ?? IDLE_SPIN_TARGET;
    currentVel = THREE.MathUtils.lerp(currentVel, IDLE_SPIN_TARGET, context.delta * 3.0);
    state.data.spinVel = currentVel;
    visual.rotation += currentVel * context.delta;

    if (state.data.roamTargetX === undefined || state.data.roamTargetY === undefined) {
        const panels = context.getAllPanelRects();
        if (panels.length > 0) {
            const panel = panels[Math.floor(Math.random() * panels.length)];
            const halfW = (panel.width / 2) + padding;
            const halfH = (panel.height / 2) + padding;
            
            state.data.roamTargetX = panel.x + (Math.random() * 2 - 1) * halfW;
            state.data.roamTargetY = panel.y + (Math.random() * 2 - 1) * halfH;
        } else {
            state.data.roamTargetX = (Math.random() * 2 - 1) * 10;
            state.data.roamTargetY = (Math.random() * 2 - 1) * 5;
        }
    }

    const destX = state.data.roamTargetX!;
    const destY = state.data.roamTargetY!;

    const dx = destX - transform.x;
    const dy = destY - transform.y;
    const distSq = dx*dx + dy*dy;

    if (distSq < 1.0) {
        state.data.roamTargetX = undefined;
        state.data.roamTargetY = undefined;
        return NodeState.SUCCESS;
    }

    motion.vx += (dx - motion.vx) * context.delta * 2.0;
    motion.vy += (dy - motion.vy) * context.delta * 2.0;

    if (target && target.x !== undefined) {
        const tDx = target.x - transform.x;
        const tDy = target.y - transform.y;
        transform.rotation = Math.atan2(tDy, tDx);
    } else {
        transform.rotation = Math.atan2(motion.vy, motion.vx);
    }

    return NodeState.RUNNING;
  }
}

export class AimAndFire extends BTNode {
  constructor(private configId: string) { super(); }

  tick(entity: Entity, context: AIContext): NodeState {
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const renderEffect = entity.getComponent<RenderEffect>(ComponentType.RenderEffect);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const motion = entity.getComponent<MotionData>(ComponentType.Motion);
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const identity = entity.getComponent<IdentityData>(ComponentType.Identity);

    if (!transform || !target || !state || !visual || !identity) return NodeState.FAILURE;
    
    const params = context.config.enemies[identity.variant as EnemyType]?.params || {};
    const totalDuration = params.aimDuration ?? 1.2;
    const projectileSpeed = params.projectileSpeed ?? 40.0;

    // PHASES:
    // 1. SQUISH (0.0 -> 0.4s) - Hunter contracts, no ball.
    // 2. GROW   (0.4 -> 1.0s) - Ball appears and grows.
    // 3. HOLD   (1.0 -> 1.2s) - Ball size locked.
    // 4. FIRE   (1.2s)
    const TIME_SQUISH = 0.4;
    const TIME_GROW_START = TIME_SQUISH;
    const TIME_GROW_END = 1.0;
    const SCALE_MIN = 0.1; // Start tiny
    const SCALE_MAX = 3.5;

    state.current = AI_STATE.CHARGING;

    // --- 1. ROTATE TO TARGET ---
    let currentVel = state.data.spinVel ?? IDLE_SPIN_TARGET;
    currentVel = THREE.MathUtils.lerp(currentVel, CHARGE_SPIN_TARGET, context.delta * 2.5);
    state.data.spinVel = currentVel;
    visual.rotation += currentVel * context.delta;

    if (motion) {
        motion.vx *= 0.8;
        motion.vy *= 0.8;
    }

    const dx = target.x - transform.x;
    const dy = target.y - transform.y;
    transform.rotation = Math.atan2(dy, dx);

    // --- 2. MANAGE TIMER ---
    if (state.timers[AITimerID.AIM] === undefined) {
        state.timers[AITimerID.AIM] = totalDuration;
    }

    const timerLeft = state.timers[AITimerID.AIM]!;
    const elapsed = totalDuration - timerLeft;

    // --- 3. PROJECTILE LOGIC ---
    if (elapsed > TIME_GROW_START) {
        if (state.data.chargingProjectileId === undefined) {
            // Spawn charging projectile
            const proj = context.spawnProjectile(
                transform.x, transform.y, 0, 0, undefined, this.configId, entity.id as number
            );
            
            const pData = proj.getComponent<ProjectileData>(ComponentType.Projectile);
            if (pData) {
                pData.state = 'CHARGING';
                pData.ownerId = entity.id as number;
            }
            
            // Start tiny
            const pRender = proj.getComponent<RenderTransform>(ComponentType.RenderTransform);
            if (pRender) pRender.scale = SCALE_MIN;

            state.data.chargingProjectileId = proj.id as number;
        }

        const projEntity = context.getEntity(state.data.chargingProjectileId);
        
        if (projEntity && projEntity.active) {
            const pRender = projEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);
            if (pRender) {
                // Normalize growth time (0.0 to 1.0)
                const growDuration = TIME_GROW_END - TIME_GROW_START;
                const growProgress = Math.min(1.0, (elapsed - TIME_GROW_START) / growDuration);
                
                // Scale Lerp
                const currentScale = SCALE_MIN + (growProgress * (SCALE_MAX - SCALE_MIN));
                pRender.scale = currentScale;
            }
        } else {
            state.data.chargingProjectileId = undefined;
        }
    }

    // --- 4. PARTICLES & SOUND ---
    // Only sizzle during growth
    if (elapsed > TIME_GROW_START && elapsed < TIME_GROW_END) {
        if (!state.timers[AITimerID.SIZZLE] || state.timers[AITimerID.SIZZLE]! <= 0) {
            context.playSound('fx_exhaust_sizzle', transform.x);
            state.timers[AITimerID.SIZZLE] = 0.15;
        } else {
            state.timers[AITimerID.SIZZLE]! -= context.delta;
        }

        const rearAngle = transform.rotation + Math.PI;
        let offset = 1.3;
        if (renderEffect) {
            offset *= (1.0 - (0.4 * renderEffect.squashFactor));
        }

        const spreadAngle = 0.25; 
        const density = 2; 

        for (let i = 0; i < density; i++) {
            const spread = (Math.random() - 0.5) * spreadAngle;
            const angle = rearAngle + spread;
            const speed = 12.0 + (Math.random() * 8.0);
            const px = transform.x + Math.cos(rearAngle) * offset;
            const py = transform.y + Math.sin(rearAngle) * offset;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            context.spawnParticle(px, py, '#F7D277', vx, vy, 0.2 + (Math.random() * 0.3), 0.8, 1);
        }
    }

    // --- 5. FIRE ---
    state.timers[AITimerID.AIM]! -= context.delta;
    
    if (state.timers[AITimerID.AIM]! <= 0) {
        state.timers[AITimerID.AIM] = undefined; 
        
        const dirX = Math.cos(transform.rotation);
        const dirY = Math.sin(transform.rotation);
        
        const projEntity = state.data.chargingProjectileId !== undefined 
            ? context.getEntity(state.data.chargingProjectileId) 
            : undefined;

        if (projEntity && projEntity.active) {
            const pData = projEntity.getComponent<ProjectileData>(ComponentType.Projectile);
            const pMotion = projEntity.getComponent<MotionData>(ComponentType.Motion);
            const pRender = projEntity.getComponent<RenderTransform>(ComponentType.RenderTransform);
            
            if (pData) {
                pData.state = 'FLIGHT';
                pData.ownerId = -1; 
            }
            if (pMotion) {
                pMotion.vx = dirX * projectileSpeed;
                pMotion.vy = dirY * projectileSpeed;
            }
            if (pRender) {
                pRender.scale = SCALE_MAX; // Lock Size
            }
            
            if (motion) {
                motion.vx = -dirX * 5.0;
                motion.vy = -dirY * 5.0;
            }

            context.playSound('fx_enemy_fire', transform.x);
            context.spawnFX('HUNTER_RECOIL', transform.x + dirX, transform.y + dirY, transform.rotation);
        }

        state.data.chargingProjectileId = undefined;
        state.current = AI_STATE.ATTACK; 
        
        return NodeState.SUCCESS;
    }
    return NodeState.RUNNING;
  }
}

export class HunterCooldown extends BTNode {
  tick(entity: Entity, context: AIContext): NodeState {
    const state = entity.getComponent<AIStateData>(ComponentType.State);
    const transform = entity.getComponent<TransformData>(ComponentType.Transform);
    const visual = entity.getComponent<RenderTransform>(ComponentType.RenderTransform);
    const target = entity.getComponent<TargetData>(ComponentType.Target);
    const identity = entity.getComponent<IdentityData>(ComponentType.Identity);

    if (!state || !transform || !visual || !identity) return NodeState.FAILURE;

    const params = context.config.enemies[identity.variant as EnemyType]?.params || {};
    const min = params.cooldownMin ?? 0.3;
    const max = params.cooldownMax ?? 0.6;

    if (state.timers[AITimerID.WAIT] === undefined) {
        state.timers[AITimerID.WAIT] = min + Math.random() * (max - min);
    }

    let currentVel = state.data.spinVel ?? CHARGE_SPIN_TARGET;
    currentVel = THREE.MathUtils.lerp(currentVel, IDLE_SPIN_TARGET, context.delta * 2.0);
    state.data.spinVel = currentVel;
    visual.rotation += currentVel * context.delta;

    if (target && target.x !== undefined) {
        const dx = target.x - transform.x;
        const dy = target.y - transform.y;
        const desiredAngle = Math.atan2(dy, dx);
        
        let diff = desiredAngle - transform.rotation;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        transform.rotation += diff * 5.0 * context.delta;
    }

    state.timers[AITimerID.WAIT]! -= context.delta;
    if (state.timers[AITimerID.WAIT]! <= 0) {
        state.timers[AITimerID.WAIT] = undefined;
        return NodeState.SUCCESS;
    }

    return NodeState.RUNNING;
  }
}
