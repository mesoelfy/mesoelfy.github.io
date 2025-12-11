import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { PanelRegistry } from '../../systems/PanelRegistrySystem'; 
import { EnemyTypes } from '../../config/Identifiers';

const getPos = (e: Entity) => e.requireComponent<TransformComponent>('Transform');
const getMotion = (e: Entity) => e.requireComponent<MotionComponent>('Motion');
const getState = (e: Entity) => e.requireComponent<StateComponent>('State');
const getTarget = (e: Entity) => e.requireComponent<TargetComponent>('Target');

export const DrillerLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    const state = getState(e);
    const target = getTarget(e);

    // USE CONFIG FROM CONTEXT
    const drillerConfig = ctx.config.enemies[EnemyTypes.DRILLER];
    const aiConfig = ctx.config.ai.DRILLER;

    if (typeof state.data.audioTimer === 'undefined') state.data.audioTimer = 0;
    if (typeof state.data.damageTimer === 'undefined') state.data.damageTimer = 0;

    let destX = target.x;
    let destY = target.y;
    
    if (target.type === 'PANEL' && target.id) {
        const rect = PanelRegistry.getPanelRect(target.id);
        if (rect) {
            destX = Math.max(rect.left, Math.min(pos.x, rect.right));
            destY = Math.max(rect.bottom, Math.min(pos.y, rect.top));
        }
    }

    const dx = destX - pos.x;
    const dy = destY - pos.y;
    const distSq = dx*dx + dy*dy;
    const dist = Math.sqrt(distSq);
    const angle = Math.atan2(dy, dx) - Math.PI/2;
    
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

        state.data.audioTimer -= ctx.delta;
        if (state.data.audioTimer <= 0) {
            ctx.playSound('loop_drill');
            state.data.audioTimer = aiConfig.AUDIO_INTERVAL + Math.random() * 0.1; 
        }

        state.data.damageTimer -= ctx.delta;
        if (state.data.damageTimer <= 0) {
             if (target.type === 'PANEL' && target.id) {
                 const dmg = drillerConfig.damage; 
                 ctx.damagePanel(target.id, dmg);
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
    }
  }
};
