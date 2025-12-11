import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { OrbitalComponent } from '../../components/data/OrbitalComponent';
import { AI_CONFIG } from '../../config/AIConfig';

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

    // Calculate dynamic stats from Context
    const executeLevel = ctx.getUpgradeLevel('EXECUTE');
    const maxShield = 10 + executeLevel;

    if (typeof state.data.shieldHP !== 'number') {
        state.data.shieldHP = 0;
    }
    state.data.maxShield = maxShield; 

    // --- STATE MACHINE ---

    if (state.current === 'SPAWN' || state.current === 'ORBIT') {
        state.current = 'CHARGING';
        state.data.shieldHP = 0; 
    }

    // 1. CHARGING (Accumulate Shield)
    if (state.current === 'CHARGING') {
        orbital.active = true;
        
        if (state.data.shieldHP <= 0 && state.data.wasHit) {
             state.current = 'BROKEN';
             state.timers.action = AI_CONFIG.DAEMON.RECOVERY_TIME;
             return;
        }

        const chargeRate = maxShield / AI_CONFIG.DAEMON.SHIELD_CHARGE_TIME; 
        state.data.shieldHP = Math.min(maxShield, state.data.shieldHP + (chargeRate * ctx.delta));

        if (state.data.shieldHP >= maxShield) {
            state.current = 'READY';
        }
    } 
    
    // 2. READY (Holding Charge)
    else if (state.current === 'READY') {
        orbital.active = true;
        
        if (state.data.shieldHP <= 0) {
             state.current = 'BROKEN';
             state.timers.action = AI_CONFIG.DAEMON.RECOVERY_TIME;
             return;
        }

        if (target.id === 'ENEMY_LOCKED') state.current = 'FIRE';
    }
    
    // 3. FIRE (Launch Shield as Bullet)
    else if (state.current === 'FIRE') {
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dist > 0 ? dx/dist : 0;
        const dirY = dist > 0 ? dy/dist : 1;
        
        pos.rotation = Math.atan2(dy, dx) - Math.PI/2;

        // Spawn using generic context, passing specific damage
        ctx.spawnProjectile(pos.x, pos.y, dirX * 35, dirY * 35, maxShield);
        ctx.spawnFX('IMPACT_WHITE', pos.x, pos.y);

        state.data.shieldHP = 0; 
        state.current = 'COOLDOWN';
        state.timers.action = AI_CONFIG.DAEMON.COOLDOWN_TIME;
    }
    
    // 4. COOLDOWN
    else if (state.current === 'COOLDOWN') {
        orbital.active = true;
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            state.data.wasHit = false;
        }
    }

    // 5. BROKEN (Shield Destroyed)
    else if (state.current === 'BROKEN') {
        state.data.shieldHP = 0;
        state.timers.action -= ctx.delta;
        
        pos.rotation += ctx.delta * AI_CONFIG.DAEMON.ROTATION_SPEED.BROKEN;

        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            state.data.wasHit = false;
        }
    }
  }
};
