import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TargetData } from '@/sys/data/TargetData';
import { RenderData } from '@/sys/data/RenderData';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

const getPos = (e: Entity) => e.requireComponent<TransformData>(ComponentType.Transform);
const getMotion = (e: Entity) => e.requireComponent<MotionData>(ComponentType.Motion);
const getState = (e: Entity) => e.requireComponent<AIStateData>(ComponentType.State);
const getTarget = (e: Entity) => e.requireComponent<TargetData>(ComponentType.Target);
const getRender = (e: Entity) => e.requireComponent<RenderData>(ComponentType.Render);

export const DrillerLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    const state = getState(e);
    const target = getTarget(e);
    const render = getRender(e);

    const drillerConfig = ctx.config.enemies[EnemyTypes.DRILLER];
    const aiConfig = ctx.config.ai.DRILLER;

    if (typeof state.data.audioTimer === 'undefined') state.data.audioTimer = 0;
    if (typeof state.data.damageTimer === 'undefined') state.data.damageTimer = 0;

    let destX = target.x;
    let destY = target.y;
    
    if (target.type === 'PANEL' && target.id) {
        const rect = ctx.getPanelRect(target.id);
        if (rect) {
            const clampX = Math.max(rect.left, Math.min(pos.x, rect.right));
            const clampY = Math.max(rect.bottom, Math.min(pos.y, rect.top));
            destX = clampX;
            destY = clampY;
        }
    }

    const dx = destX - pos.x;
    const dy = destY - pos.y;
    const distSq = dx*dx + dy*dy;
    const dist = Math.sqrt(distSq);
    const angle = Math.atan2(dy, dx);
    
    // Default Visuals
    let targetScale = 1.0;
    
    if (dist <= aiConfig.TIP_OFFSET + aiConfig.SNAP_THRESHOLD && target.id !== null) {
        state.current = 'DRILLING';
        
        if (dist > 0.001) {
            const normX = dx / dist;
            const normY = dy / dist;
            pos.x = destX - (normX * aiConfig.TIP_OFFSET);
            pos.y = destY - (normY * aiConfig.TIP_OFFSET);
        }

        motion.vx = 0;
        motion.vy = 0;
        pos.rotation = angle;

        ctx.spawnDrillSparks(destX, destY, angle);

        // Faster spin when drilling
        render.visualRotation += ctx.delta * 20.0;

        state.data.audioTimer -= ctx.delta;
        if (state.data.audioTimer <= 0) {
            ctx.playSound('loop_drill', pos.x);
            state.data.audioTimer = aiConfig.AUDIO_INTERVAL + Math.random() * 0.1; 
        }

        state.data.damageTimer -= ctx.delta;
        if (state.data.damageTimer <= 0) {
             if (target.type === 'PANEL' && target.id) {
                 ctx.damagePanel(target.id, drillerConfig.damage);
                 state.data.damageTimer = 0.2; 
             }
        }

    } else {
        state.current = 'MOVING';
        state.data.audioTimer = 0;
        state.data.damageTimer = 0;

        const speed = drillerConfig.baseSpeed;
        if (dist > 0.001) {
            motion.vx = (dx / dist) * speed;
            motion.vy = (dy / dist) * speed;
            pos.rotation = angle; 
        }
        
        // Normal spin
        render.visualRotation += ctx.delta * 5.0;
    }

    if (state.current === 'SPAWN') {
        const progress = 1.0 - (state.timers.spawn / 1.5);
        targetScale = Math.pow(progress, 2); 
    }
    
    render.visualScale = targetScale;
  }
};
