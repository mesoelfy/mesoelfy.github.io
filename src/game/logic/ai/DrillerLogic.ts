import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { PanelRegistry } from '../../systems/PanelRegistrySystem'; 
import { ENEMY_CONFIG } from '../../config/EnemyConfig';
import { EnemyTypes } from '../../config/Identifiers';
import { MODEL_CONFIG } from '../../config/ModelConfig'; // NEW

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

    // Default target coords
    let destX = target.x;
    let destY = target.y;
    
    // Find closest point on Panel Edge
    if (target.type === 'PANEL' && target.id) {
        const rect = PanelRegistry.getPanelRect(target.id);
        if (rect) {
            destX = Math.max(rect.left, Math.min(pos.x, rect.right));
            destY = Math.max(rect.bottom, Math.min(pos.y, rect.top));
        }
    }

    // Vector to Target
    const dx = destX - pos.x;
    const dy = destY - pos.y;
    const distSq = dx*dx + dy*dy;
    const dist = Math.sqrt(distSq);
    
    // Face the impact point (-PI/2 correction for Cone geometry)
    const angle = Math.atan2(dy, dx) - Math.PI/2;

    // --- EXACT GEOMETRY CALCULATIONS ---
    // The Cone pivots at its center. The tip is at +height/2 local Y.
    // We want the tip to touch 'dest'. So Center should be 'height/2' away from 'dest'.
    const TIP_OFFSET = MODEL_CONFIG.DRILLER.height / 2;
    
    // Threshold to snap (Small buffer to prevent jitter)
    const SNAP_THRESHOLD = 0.1;

    // Check if we are close enough to latch on
    // dist is Center-to-Wall distance. We want it to be TIP_OFFSET.
    if (dist <= TIP_OFFSET + SNAP_THRESHOLD && target.id !== null) {
        state.current = 'DRILLING';
        
        // 1. SNAP POSITION
        // We calculate the normalized vector from Wall -> Driller
        // Then place Driller exactly TIP_OFFSET away from Wall along that vector.
        if (dist > 0.001) { // Prevent divide by zero
            const normX = dx / dist;
            const normY = dy / dist;
            
            // dest - (Direction * Offset)
            // Since (dx,dy) points TO wall, subtracting it moves AWAY from wall.
            pos.x = destX - (normX * TIP_OFFSET);
            pos.y = destY - (normY * TIP_OFFSET);
        }

        // 2. Lock Movement
        motion.vx = 0;
        motion.vy = 0;
        pos.rotation = angle;

        // 3. Drill Effect
        if (Math.random() < ctx.delta * 2.0) { 
             // Sparks at destX/Y (The Tip)
             ctx.spawnDrillSparks(destX, destY, '#9E4EA5');
             if (target.type === 'PANEL' && target.id) {
                 ctx.damagePanel(target.id, ENEMY_CONFIG[EnemyTypes.DRILLER].damage);
             }
        }
    } else {
        state.current = 'MOVING';
        
        const speed = ENEMY_CONFIG[EnemyTypes.DRILLER].baseSpeed;
        
        // Move towards target
        if (dist > 0.001) {
            motion.vx = (dx / dist) * speed;
            motion.vy = (dy / dist) * speed;
            pos.rotation = angle;
        }
    }
  }
};
