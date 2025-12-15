import { Entity } from '@/engine/ecs/Entity';
import { CombatContext } from './types';
import { HealthData } from '@/sys/data/HealthData';
import { IdentityData } from '@/sys/data/IdentityData';
import { AIStateData } from '@/sys/data/AIStateData';
import { TransformData } from '@/sys/data/TransformData';
import { EnemyTypes } from '@/sys/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

const getHp = (e: Entity) => e.getComponent<HealthData>(ComponentType.Health);
const getId = (e: Entity) => e.getComponent<IdentityData>(ComponentType.Identity);
const getPos = (e: Entity) => e.getComponent<TransformData>(ComponentType.Transform);

export const handlePlayerCrash = (player: Entity, enemy: Entity, ctx: CombatContext) => {
  const pId = getId(player);
  
  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, enemy, ctx);
      return;
  }

  const eId = getId(enemy);
  const pos = getPos(enemy);
  const pPos = getPos(player);
  const x = pos ? pos.x : 0;

  // Calculate Impact Angle: Vector from Player -> Enemy (Force Direction)
  let angle = 0;
  if (pos && pPos) {
      angle = Math.atan2(pos.y - pPos.y, pos.x - pPos.x);
  }
  // To spray "Away" from impact (exit wound), we pass Angle + PI to the VFX system?
  // Wait, VFXSystem adds PI to its input.
  // We want particles to fly ALONG the force vector (Player->Enemy).
  // So we should pass Angle + PI, so that (Angle + PI) + PI = Angle.
  const sprayAngle = angle + Math.PI;

  if (eId?.variant === EnemyTypes.KAMIKAZE) {
      ctx.damagePlayer(3); 
      ctx.addTrauma(0.5); 
      ctx.destroyEntity(enemy, 'EXPLOSION_RED', sprayAngle);
      ctx.playSpatialAudio('fx_impact_heavy', x);
  } else {
      ctx.damagePlayer(1);
      ctx.addTrauma(0.2); 
      ctx.destroyEntity(enemy, 'EXPLOSION_PURPLE', sprayAngle);
      ctx.playSpatialAudio('fx_impact_light', x);
  }
};

export const handlePlayerHit = (player: Entity, bullet: Entity, ctx: CombatContext) => {
  const pId = getId(player);

  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, bullet, ctx, 1);
      return;
  }

  const pos = getPos(bullet);
  const x = pos ? pos.x : 0;

  ctx.damagePlayer(3);
  ctx.destroyEntity(bullet, 'IMPACT_RED');
  ctx.playSpatialAudio('fx_impact_heavy', x);
};

export const handleEnemyHit = (enemy: Entity, bullet: Entity, ctx: CombatContext) => {
  // Pass the bullet's travel direction for "blow through" effect
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

function handleMassExchange(a: Entity, b: Entity, fx: string, ctx: CombatContext, sprayAngle?: number) {
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
      ctx.destroyEntity(a, 'IMPACT_WHITE', sprayAngle);
      soundKey = 'fx_impact_light';
  }
  if (hpB && hpB.current <= 0) {
      ctx.destroyEntity(b, 'IMPACT_WHITE', sprayAngle); // B usually bullet, spray not critical here
      soundKey = 'fx_impact_light';
  }
  
  if (soundKey) ctx.playSpatialAudio(soundKey, x);
}
