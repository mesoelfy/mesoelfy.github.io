import { Entity } from '@/engine/ecs/Entity';
import { CombatContext } from './types';
import { HealthData } from '@/sys/data/HealthData';
import { IdentityData } from '@/sys/data/IdentityData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TransformData } from '@/sys/data/TransformData';
import { CombatData } from '@/sys/data/CombatData';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

const getHp = (e: Entity) => e.getComponent<HealthData>(ComponentType.Health);
const getId = (e: Entity) => e.getComponent<IdentityData>(ComponentType.Identity);
const getPos = (e: Entity) => e.getComponent<TransformData>(ComponentType.Transform);
const getCombat = (e: Entity) => e.getComponent<CombatData>(ComponentType.Combat);

// Helper to determine death FX based on enemy type
// In the future, this could be a 'VisualData' component property
const getExplosionType = (variant: string, angle?: boolean) => {
    switch (variant) {
        case EnemyTypes.KAMIKAZE: return angle ? 'EXPLOSION_RED_DIR' : 'EXPLOSION_RED';
        case EnemyTypes.HUNTER: return angle ? 'EXPLOSION_YELLOW_DIR' : 'EXPLOSION_YELLOW';
        default: return angle ? 'EXPLOSION_PURPLE_DIR' : 'EXPLOSION_PURPLE';
    }
};

export const handlePlayerCrash = (player: Entity, enemy: Entity, ctx: CombatContext) => {
  const pId = getId(player);
  
  // Special Handling for Daemon (Shields/States)
  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, enemy, ctx);
      return;
  }

  const eId = getId(enemy);
  const combat = getCombat(enemy);
  const pos = getPos(enemy);
  const pPos = getPos(player);
  const x = pos ? pos.x : 0;

  // 1. Calculate Damage (Data Driven)
  // Default to 1 if no combat component found
  const damage = combat ? combat.damage : 1;

  // 2. Calculate Impact Angle
  let angle = 0;
  if (pos && pPos) {
      angle = Math.atan2(pos.y - pPos.y, pos.x - pPos.x);
  }
  const sprayAngle = angle + Math.PI;

  // 3. Apply Damage
  ctx.damagePlayer(damage);
  
  // 4. Resolve Entity Death
  const variant = eId?.variant || 'UNKNOWN';
  const fx = getExplosionType(variant, true);
  
  // Dynamic Trauma based on damage severity
  const trauma = damage >= 3 ? 0.5 : 0.2;
  ctx.addTrauma(trauma);

  ctx.destroyEntity(enemy, fx, sprayAngle);
  
  // Audio based on damage severity
  const audio = damage >= 3 ? 'fx_impact_heavy' : 'fx_impact_light';
  ctx.playSpatialAudio(audio, x);
};

export const handlePlayerHit = (player: Entity, bullet: Entity, ctx: CombatContext) => {
  const pId = getId(player);

  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, bullet, ctx, 1);
      return;
  }

  const combat = getCombat(bullet);
  const pos = getPos(bullet);
  const x = pos ? pos.x : 0;

  const damage = combat ? combat.damage : 1;

  ctx.damagePlayer(damage);
  ctx.destroyEntity(bullet, 'IMPACT_RED');
  ctx.playSpatialAudio('fx_impact_heavy', x);
};

export const handleEnemyHit = (enemy: Entity, bullet: Entity, ctx: CombatContext) => {
  const bPos = getPos(bullet);
  const sprayAngle = bPos ? bPos.rotation + Math.PI : 0;
  handleMassExchange(enemy, bullet, 'IMPACT_WHITE', ctx, sprayAngle);
};

export const handleBulletClash = (bulletA: Entity, bulletB: Entity, ctx: CombatContext) => {
  handleMassExchange(bulletA, bulletB, 'CLASH_YELLOW', ctx);
};

function resolveDaemonCollision(daemon: Entity, attacker: Entity, ctx: CombatContext, fixedDamage?: number) {
  const state = daemon.getComponent<AIStateData>(ComponentType.State);
  if (!state) return;

  const pos = getPos(attacker);
  const x = pos ? pos.x : 0;

  // Use fixed damage if provided (e.g. from bullet hit which has no combat comp sometimes?), 
  // otherwise read from attacker.
  let incomingDamage = fixedDamage || 1;
  if (!fixedDamage) {
      const combat = getCombat(attacker);
      if (combat) incomingDamage = combat.damage;
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

function handleMassExchange(a: Entity, b: Entity, fx: string, ctx: CombatContext, sprayAngle?: number) {
  const hpA = getHp(a);
  const hpB = getHp(b);
  const cA = getCombat(a);
  const cB = getCombat(b);

  // Damage logic: A deals damage to B, B deals damage to A
  const dmgA = cA ? cA.damage : 1;
  const dmgB = cB ? cB.damage : 1;

  if (hpA) hpA.current = Math.max(0, hpA.current - dmgB);
  if (hpB) hpB.current = Math.max(0, hpB.current - dmgA);

  const pos = getPos(a);
  const x = pos ? pos.x : 0;
  if (pos) ctx.spawnFX(fx, pos.x, pos.y);

  let soundKey = '';

  if (hpA && hpA.current <= 0) {
      ctx.destroyEntity(a, 'IMPACT_WHITE', sprayAngle);
      soundKey = 'fx_impact_light';
  }
  if (hpB && hpB.current <= 0) {
      ctx.destroyEntity(b, 'IMPACT_WHITE', sprayAngle); 
      soundKey = 'fx_impact_light';
  }
  
  if (soundKey) ctx.playSpatialAudio(soundKey, x);
}
