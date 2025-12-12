import { Entity } from '../../core/ecs/Entity';
import { CombatContext } from './types';
import { HealthComponent } from '../../components/data/HealthComponent';
import { IdentityComponent } from '../../components/data/IdentityComponent';
import { StateComponent } from '../../components/data/StateComponent';
import { TransformComponent } from '../../components/data/TransformComponent';
import { EnemyTypes } from '@/game/config/Identifiers';

// --- HELPERS ---

const getHp = (e: Entity) => e.getComponent<HealthComponent>('Health');
const getId = (e: Entity) => e.getComponent<IdentityComponent>('Identity');
const getPos = (e: Entity) => e.getComponent<TransformComponent>('Transform');

// --- HANDLERS ---

/**
 * PLAYER vs ENEMY
 */
export const handlePlayerCrash = (player: Entity, enemy: Entity, ctx: CombatContext) => {
  const pId = getId(player);
  
  // 1. DAEMON RAMMING
  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, enemy, ctx);
      return;
  }

  // 2. STANDARD PLAYER CRASH
  const eId = getId(enemy);
  
  // AAA POLISH: Specific Shake Tuning
  if (eId?.variant === EnemyTypes.KAMIKAZE) {
      ctx.damagePlayer(25);
      ctx.addTrauma(0.9); // VIOLENT SHAKE
      ctx.destroyEntity(enemy, 'EXPLOSION_RED');
  } else {
      ctx.damagePlayer(10);
      ctx.addTrauma(0.5); // HEAVY IMPACT (Driller/Hunter)
      ctx.destroyEntity(enemy, 'EXPLOSION_PURPLE');
  }
};

/**
 * PLAYER vs ENEMY_BULLET
 */
export const handlePlayerHit = (player: Entity, bullet: Entity, ctx: CombatContext) => {
  const pId = getId(player);

  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, bullet, ctx, 5);
      return;
  }

  ctx.damagePlayer(10);
  ctx.destroyEntity(bullet, 'IMPACT_RED');
  // Note: VFXSystem adds standard trauma (0.2 - 0.45) for damage events automatically
};

/**
 * ENEMY vs PLAYER_BULLET
 */
export const handleEnemyHit = (enemy: Entity, bullet: Entity, ctx: CombatContext) => {
  handleMassExchange(enemy, bullet, 'IMPACT_WHITE', ctx);
};

/**
 * BULLET vs BULLET
 */
export const handleBulletClash = (bulletA: Entity, bulletB: Entity, ctx: CombatContext) => {
  handleMassExchange(bulletA, bulletB, 'CLASH_YELLOW', ctx);
};

// --- SHARED LOGIC ---

function resolveDaemonCollision(daemon: Entity, attacker: Entity, ctx: CombatContext, fixedDamage?: number) {
  const state = daemon.getComponent<StateComponent>('State');
  if (!state) return;

  let incomingDamage = fixedDamage || 10;
  
  if (!fixedDamage) {
      const hp = getHp(attacker);
      const id = getId(attacker);
      if (id?.variant === EnemyTypes.KAMIKAZE) incomingDamage = 20;
      else if (hp) incomingDamage = hp.current * 5; 
  }

  const shield = state.data.shieldHP || 0;

  // Active Shield Logic
  if (state.current === 'CHARGING' || state.current === 'READY') {
      if (shield > 0) {
          state.data.shieldHP = Math.max(0, shield - incomingDamage);
          state.data.wasHit = true; 
          
          if (attacker.hasTag('ENEMY')) {
              ctx.destroyEntity(attacker, 'CLASH_YELLOW');
          } else {
              ctx.destroyEntity(attacker, 'IMPACT_WHITE');
          }
          return;
      }
  }

  if (attacker.hasTag('ENEMY')) {
      ctx.destroyEntity(attacker, 'EXPLOSION_RED');
  } else {
      ctx.destroyEntity(attacker, 'IMPACT_RED');
  }
}

function handleMassExchange(a: Entity, b: Entity, fx: string, ctx: CombatContext) {
  const hpA = getHp(a);
  const hpB = getHp(b);

  const valA = hpA ? hpA.current : 1;
  const valB = hpB ? hpB.current : 1;
  const impact = Math.min(valA, valB);

  if (hpA) hpA.current = Math.max(0, hpA.current - impact);
  if (hpB) hpB.current = Math.max(0, hpB.current - impact);

  const pos = getPos(a);
  if (pos) ctx.spawnFX(fx, pos.x, pos.y);

  if (hpA && hpA.current <= 0) ctx.destroyEntity(a, 'IMPACT_WHITE');
  if (hpB && hpB.current <= 0) ctx.destroyEntity(b, 'IMPACT_WHITE');
}
