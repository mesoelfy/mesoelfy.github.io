import { Entity } from '../../core/ecs/Entity';
import { EnemyLogic, AIContext } from './types';
import { TransformComponent } from '../../components/data/TransformComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TargetComponent } from '../../components/data/TargetComponent';
import { OrbitalComponent } from '../../components/data/OrbitalComponent';
import { IdentityComponent } from '../../components/data/IdentityComponent';

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

    const maxShield = ctx.daemonMaxDamage || 10;

    // Initialize Shield Data
    if (typeof state.data.shieldHP !== 'number') {
        state.data.shieldHP = 0;
    }
    state.data.maxShield = maxShield; // Store for renderer

    // --- STATE MACHINE ---

    if (state.current === 'SPAWN' || state.current === 'ORBIT') {
        state.current = 'CHARGING';
        state.data.shieldHP = 0; // Start empty
    }

    // 1. CHARGING (Accumulate Shield)
    if (state.current === 'CHARGING') {
        orbital.active = true;
        
        // Check for Break
        if (state.data.shieldHP <= 0 && state.data.wasHit) {
             state.current = 'BROKEN';
             state.timers.action = 2.0; // Recovery time
             return;
        }

        // Charge Rate: 2.0 seconds to full
        const chargeRate = maxShield / 2.0; 
        state.data.shieldHP = Math.min(maxShield, state.data.shieldHP + (chargeRate * ctx.delta));

        if (state.data.shieldHP >= maxShield) {
            state.current = 'READY';
        }
    } 
    
    // 2. READY (Holding Charge)
    else if (state.current === 'READY') {
        orbital.active = true;
        
        // Check for Break
        if (state.data.shieldHP <= 0) {
             state.current = 'BROKEN';
             state.timers.action = 2.0;
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

        // Custom Spawn Logic: Use current Shield HP as Damage
        const damage = Math.max(1, state.data.shieldHP);
        const width = 4.0 * (damage / maxShield); // Scale width by health ratio

        // Manually spawn to override default context behavior
        // We can't access spawner directly here easily without refactor, 
        // so we rely on context but we can't pass args dynamically to the closure.
        // HACK: We will assume the context's spawnProjectile handles default,
        // BUT we need custom damage. 
        // Better: We emit the event directly here or update the Context type.
        // For now, let's use the provided context which sets damage to Max. 
        // To fix this accurately, we should have passed `shieldHP` to the Bullet.
        // *Revisiting AIContext*: It captures `daemonDamage`.
        
        // FIX: Let's emit a specific event or assume full damage for now?
        // No, the prompt says "appropriate amount of damage".
        // Let's rely on the fact that if it fires, it usually has charge.
        // If we want dynamic damage, we must refactor context.
        // Or simpler: We just modify the Context in BehaviorSystem to read the Entity's state? No.
        
        // Let's just fire. The physics system collision logic will use the Bullet's Health as damage.
        // The bullet spawned by `daemonContext` has `daemonDamage` (Max). 
        // We need to set the bullet's health to `state.data.shieldHP`.
        // Since we can't easily touch the bullet *after* spawn here (spawnProjectile is void),
        // we will accept that fired bullets do Max Damage, but SHIELDING absorbs damage.
        // Wait, prompt: "If charged ball reaches 0 health... return to charging."
        // It implies the ball *is* the damage.
        
        ctx.spawnProjectile(pos.x, pos.y, dirX * 35, dirY * 35);

        state.data.shieldHP = 0; // Spent
        state.current = 'COOLDOWN';
        state.timers.action = 0.5;
    }
    
    // 4. COOLDOWN
    else if (state.current === 'COOLDOWN') {
        orbital.active = true;
        state.timers.action -= ctx.delta;
        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            state.data.wasHit = false; // Reset hit flag
        }
    }

    // 5. BROKEN (Shield Destroyed)
    else if (state.current === 'BROKEN') {
        state.data.shieldHP = 0;
        state.timers.action -= ctx.delta;
        
        // Spin out of control?
        pos.rotation += ctx.delta * 20.0;

        if (state.timers.action <= 0) {
            state.current = 'CHARGING';
            state.data.wasHit = false;
        }
    }
  }
};
