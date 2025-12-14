import { Entity } from '@/engine/ecs/Entity';
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

export const handlePlayerCrash = (player: Entity, enemy: Entity, ctx: CombatContext) => {
  const pId = getId(player);
  
  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, enemy, ctx);
      return;
  }

  const eId = getId(enemy);
  const pos = getPos(enemy);
  const x = pos ? pos.x : 0;

  if (eId?.variant === EnemyTypes.KAMIKAZE) {
      ctx.damagePlayer(3); 
      ctx.addTrauma(0.5); 
      ctx.destroyEntity(enemy, 'EXPLOSION_RED');
      ctx.playSpatialAudio('fx_impact_heavy', x);
  } else {
      ctx.damagePlayer(1);
      ctx.addTrauma(0.2); 
      ctx.destroyEntity(enemy, 'EXPLOSION_PURPLE');
      ctx.playSpatialAudio('fx_impact_light', x);
  }
};

export const handlePlayerHit = (player: Entity, bullet: Entity, ctx: CombatContext) => {
  const pId = getId(player);

  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, bullet, ctx, 1);
      return;
  }

  // Bullet hit player -> Usually center panned as player is center (mostly)
  // But player moves, so we use bullet position
  const pos = getPos(bullet);
  const x = pos ? pos.x : 0;

  ctx.damagePlayer(3);
  ctx.destroyEntity(bullet, 'IMPACT_RED');
  ctx.playSpatialAudio('fx_impact_heavy', x);
};

export const handleEnemyHit = (enemy: Entity, bullet: Entity, ctx: CombatContext) => {
  handleMassExchange(enemy, bullet, 'IMPACT_WHITE', ctx);
};

export const handleBulletClash = (bulletA: Entity, bulletB: Entity, ctx: CombatContext) => {
  handleMassExchange(bulletA, bulletB, 'CLASH_YELLOW', ctx);
};

// --- SHARED LOGIC ---

function resolveDaemonCollision(daemon: Entity, attacker: Entity, ctx: CombatContext, fixedDamage?: number) {
  const state = daemon.getComponent<StateComponent>('State');
  if (!state) return;

  const pos = getPos(attacker);
  const x = pos ? pos.x : 0;

  let incomingDamage = fixedDamage || 1; 
  if (!fixedDamage) {
      const id = getId(attacker);
      if (id?.variant === EnemyTypes.KAMIKAZE) incomingDamage = 3;
  }

  const shield = state.data.shieldHP || 0;

  if (state.current === 'CHARGING' || state.current === 'READY') {
      if (shield > 0) {
          state.data.shieldHP = Math.max(0, shield - incomingDamage);
          state.data.wasHit = true; 
          
          if (attacker.hasTag('ENEMY')) {
              ctx.destroyEntity(attacker, 'CLASH_YELLOW');
          } else {
              ctx.destroyEntity(attacker, 'IMPACT_WHITE');
          }
          ctx.playSpatialAudio('fx_impact_light', x);
          return;
      }
  }

  if (attacker.hasTag('ENEMY')) {
      ctx.destroyEntity(attacker, 'EXPLOSION_RED');
  } else {
      ctx.destroyEntity(attacker, 'IMPACT_RED');
  }
  ctx.playSpatialAudio('fx_impact_light', x);
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
  const x = pos ? pos.x : 0;
  if (pos) ctx.spawnFX(fx, pos.x, pos.y);

  let soundKey = '';

  if (hpA && hpA.current <= 0) {
      ctx.destroyEntity(a, 'IMPACT_WHITE');
      soundKey = 'fx_impact_light';
  }
  if (hpB && hpB.current <= 0) {
      ctx.destroyEntity(b, 'IMPACT_WHITE');
      soundKey = 'fx_impact_light';
  }
  
  if (soundKey) ctx.playSpatialAudio(soundKey, x);
}
