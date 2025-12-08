import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { OrbitalComponent } from '../../components/data/OrbitalComponent';

const getPos = (e: Entity) => e.requireComponent<TransformComponent>('Transform');
const getState = (e: Entity) => e.requireComponent<StateComponent>('State');
const getTarget = (e: Entity) => e.requireComponent<TargetComponent>('Target');
const getOrbital = (e: Entity) => e.requireComponent<OrbitalComponent>('Orbital');

export const DaemonLogic: EnemyLogic = {
  update: (e: Entity, ctx: AIContext) => {
    const pos = getPos(e);
    const state = getState(e);
    const target = getTarget(e);
    const orbital = getOrbital(e);

    if (state.current === 'SPAWN' || state.current === 'ORBIT') {
        state.current = 'CHARGING';
        state.timers.action = 2.0; 
    }

    // CHARGING
    if (state.current === 'CHARGING') {
        orbital.active = true;
        state.timers.action -= ctx.delta;
        pos.rotation += ctx.delta * 10.0; // Fast Spin
        if (state.timers.action <= 0) state.current = 'READY';
    } 
    
    // READY
    else if (state.current === 'READY') {
        orbital.active = true;
        pos.rotation += ctx.delta * 1.0; // Slow Spin
        if (target.id === 'ENEMY_LOCKED') state.current = 'FIRE';
    }
    
    // FIRE
    else if (state.current === 'FIRE') {
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        
        pos.rotation = Math.atan2(dy, dx) - Math.PI/2;

        ctx.spawnProjectile(pos.x, pos.y, dirX * 35, dirY * 35);
        
        // Removed orbital angle recoil. Visuals handled in Renderer.

        state.current = 'COOLDOWN';
        state.timers.action = 0.5;
    }
    
    // COOLDOWN
    else if (state.current === 'COOLDOWN') {
        orbital.active = true;
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            state.timers.action = 2.0;
        }
    }
  }
};
