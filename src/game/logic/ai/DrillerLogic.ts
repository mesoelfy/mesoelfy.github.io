import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { PanelRegistry } from '../../systems/PanelRegistrySystem'; 
import { ENEMY_CONFIG } from '../../config/EnemyConfig';
import { EnemyTypes } from '../../config/Identifiers';
import { MODEL_CONFIG } from '../../config/ModelConfig';

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

    // Init audio timer if missing
    if (typeof state.data.audioTimer === 'undefined') state.data.audioTimer = 0;

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
    const TIP_OFFSET = MODEL_CONFIG.DRILLER.height / 2;
    const SNAP_THRESHOLD = 0.1;

    // --- DRILLING STATE ---
    if (dist <= TIP_OFFSET + SNAP_THRESHOLD && target.id !== null) {
        state.current = 'DRILLING';
        
        // Snap
        if (dist > 0.001) {
            const normX = dx / dist;
            const normY = dy / dist;
            pos.x = destX - (normX * TIP_OFFSET);
            pos.y = destY - (normY * TIP_OFFSET);
        }

        motion.vx = 0;
        motion.vy = 0;
        pos.rotation = angle;

        ctx.spawnDrillSparks(destX, destY, angle);

        // --- AUDIO LOGIC ---
        // Play sound every 0.3 seconds while drilling
        state.data.audioTimer -= ctx.delta;
        if (state.data.audioTimer <= 0) {
            ctx.playSound('driller_drill');
            // Randomize slightly to avoid machine-gun effect
            state.data.audioTimer = 0.25 + Math.random() * 0.1; 
        }

        if (Math.random() < ctx.delta * 2.0) { 
             if (target.type === 'PANEL' && target.id) {
                 ctx.damagePanel(target.id, ENEMY_CONFIG[EnemyTypes.DRILLER].damage);
             }
        }
    } else {
        // --- MOVING STATE ---
        state.current = 'MOVING';
        
        // Reset timer so it plays immediately upon contact
        state.data.audioTimer = 0;

        const speed = ENEMY_CONFIG[EnemyTypes.DRILLER].baseSpeed;
        if (dist > 0.001) {
            motion.vx = (dx / dist) * speed;
            motion.vy = (dy / dist) * speed;
            pos.rotation = angle;
        }
    }
  }
};
