import { Entity } from '@/core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/game/data/TransformData';
import { MotionData } from '@/game/data/MotionData';
import { TargetData } from '@/game/data/TargetData';
import { AIStateData } from '@/game/data/AIStateData';
import { RenderData } from '@/game/data/RenderData';
import { ENEMY_CONFIG } from '@/game/config/EnemyConfig';
import { EnemyTypes } from '@/game/config/Identifiers';
import { AI_CONFIG } from '@/game/config/AIConfig';
import { ComponentType } from '@/core/ecs/ComponentType';

const getPos = (e: Entity) => e.requireComponent<TransformData>(ComponentType.Transform);
const getMotion = (e: Entity) => e.requireComponent<MotionData>(ComponentType.Motion);
const getTarget = (e: Entity) => e.requireComponent<TargetData>(ComponentType.Target);
const getState = (e: Entity) => e.requireComponent<AIStateData>(ComponentType.State);
const getRender = (e: Entity) => e.requireComponent<RenderData>(ComponentType.Render);

export const KamikazeLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    const target = getTarget(e);
    const state = getState(e);
    const render = getRender(e);

    if (state.current === 'SPAWN') {
        state.timers.spawn -= ctx.delta;
        const progress = 1.0 - (state.timers.spawn / 1.5);
        render.visualScale = Math.pow(progress, 2);
        
        if (state.timers.spawn <= 0) {
            state.current = 'MOVING';
        }
        return; 
    }

    render.visualScale = 1.0;
    
    // Tumble effect (simple accumulation)
    render.visualRotation += ctx.delta * 5.0; 

    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > AI_CONFIG.KAMIKAZE.ENGAGEMENT_DIST) {
      const speed = ENEMY_CONFIG[EnemyTypes.KAMIKAZE].baseSpeed;
      motion.vx = (dx / dist) * speed;
      motion.vy = (dy / dist) * speed;
      
      // Face direction of movement
      pos.rotation += AI_CONFIG.KAMIKAZE.ROTATION_SPEED * ctx.delta; 
    }
  }
};
