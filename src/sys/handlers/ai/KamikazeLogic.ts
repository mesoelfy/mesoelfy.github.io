import { Entity } from '@/engine/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformData } from '@/sys/data/TransformData';
import { MotionData } from '@/sys/data/MotionData';
import { TargetData } from '@/sys/data/TargetData';
import { AIStateData } from '@/sys/data/AIStateData';
import { ENEMY_CONFIG } from '@/sys/config/EnemyConfig';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { AI_CONFIG } from '@/sys/config/AIConfig';
import { ComponentType } from '@/engine/ecs/ComponentType';

const getPos = (e: Entity) => e.requireComponent<TransformData>(ComponentType.Transform);
const getMotion = (e: Entity) => e.requireComponent<MotionData>(ComponentType.Motion);
const getTarget = (e: Entity) => e.requireComponent<TargetData>(ComponentType.Target);
const getState = (e: Entity) => e.requireComponent<AIStateData>(ComponentType.State);

export const KamikazeLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const motion = getMotion(e);
    const target = getTarget(e);
    const state = getState(e);

    if (state.current === 'SPAWN') {
        state.timers.spawn -= ctx.delta;
        if (state.timers.spawn <= 0) {
            state.current = 'MOVING';
        }
        return; 
    }

    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > AI_CONFIG.KAMIKAZE.ENGAGEMENT_DIST) {
      const speed = ENEMY_CONFIG[EnemyTypes.KAMIKAZE].baseSpeed;
      motion.vx = (dx / dist) * speed;
      motion.vy = (dy / dist) * speed;
      
      pos.rotation += AI_CONFIG.KAMIKAZE.ROTATION_SPEED * ctx.delta; 
    }
  }
};
