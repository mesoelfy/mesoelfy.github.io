import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { MotionComponent } from '../../components/data/MotionComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { ENEMY_CONFIG } from '../../config/EnemyConfig';
import { EnemyTypes } from '../../config/Identifiers';
import { AI_CONFIG } from '../../config/AIConfig';

const getPos = (e: Entity) => e.requireComponent<TransformComponent>('Transform');
const getMotion = (e: Entity) => e.requireComponent<MotionComponent>('Motion');
const getTarget = (e: Entity) => e.requireComponent<TargetComponent>('Target');
const getState = (e: Entity) => e.requireComponent<StateComponent>('State');

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
