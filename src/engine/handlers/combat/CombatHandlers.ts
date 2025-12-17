import { Entity } from '@/engine/ecs/Entity';
import { CombatContext } from './types';
import { HealthData } from '@/engine/ecs/components/HealthData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { CombatData } from '@/engine/ecs/components/CombatData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';

const getHp = (e: Entity) => e.getComponent<HealthData>(ComponentType.Health);
const getId = (e: Entity) => e.getComponent<IdentityData>(ComponentType.Identity);
const getPos = (e: Entity) => e.getComponent<TransformData>(ComponentType.Transform);
const getCombat = (e: Entity) => e.getComponent<CombatData>(ComponentType.Combat);

const getExplosionType = (variant: string, angle?: boolean) => {
    switch (variant) {
        case EnemyTypes.KAMIKAZE: return angle ? 'EXPLOSION_RED_DIR' : 'EXPLOSION_RED';
        case EnemyTypes.HUNTER: return angle ? 'EXPLOSION_YELLOW_DIR' : 'EXPLOSION_YELLOW';
        default: return angle ? 'EXPLOSION_PURPLE_DIR' : 'EXPLOSION_PURPLE';
    }
};

export const handlePlayerCrash = (player: Entity, enemy: Entity, ctx: CombatContext) => {
  const pId = getId(player);
  if (pId?.variant === EnemyTypes.DAEMON) { resolveDaemonCollision(player, enemy, ctx); return; }

  const eId = getId(enemy);
  const combat = getCombat(enemy);
  const pos = getPos(enemy);
  const pPos = getPos(player);
  const damage = combat ? combat.damage : 1;

  let sprayAngle = 0;
  if (pos && pPos) sprayAngle = Math.atan2(pos.y - pPos.y, pos.x - pPos.x) + Math.PI;

  ctx.damagePlayer(damage);
  ctx.addTrauma(damage >= 3 ? 0.5 : 0.2);
  ctx.destroyEntity(enemy, getExplosionType(eId?.variant || 'UNKNOWN', true), sprayAngle);
  ctx.playSpatialAudio(damage >= 3 ? 'fx_impact_heavy' : 'fx_impact_light', pos ? pos.x : 0);
};

export const handlePlayerHit = (player: Entity, bullet: Entity, ctx: CombatContext) => {
  const pId = getId(player);
  if (pId?.variant === EnemyTypes.DAEMON) { resolveDaemonCollision(player, bullet, ctx, 1); return; }

  const combat = getCombat(bullet);
  const pos = getPos(bullet);
  const damage = combat ? combat.damage : 1;

  ctx.damagePlayer(damage);
  ctx.destroyEntity(bullet, 'IMPACT_RED');
  ctx.playSpatialAudio('fx_impact_heavy', pos ? pos.x : 0);
};

export const handleEnemyHit = (enemy: Entity, bullet: Entity, ctx: CombatContext) => {
  const bPos = getPos(bullet);
  handleMassExchange(enemy, bullet, 'IMPACT_WHITE', ctx, bPos ? bPos.rotation + Math.PI : 0);
};

export const handleBulletClash = (bulletA: Entity, bulletB: Entity, ctx: CombatContext) => {
  handleMassExchange(bulletA, bulletB, 'CLASH_YELLOW', ctx);
};

function resolveDaemonCollision(daemon: Entity, attacker: Entity, ctx: CombatContext, fixedDamage?: number) {
  const state = daemon.getComponent<AIStateData>(ComponentType.State);
  if (!state) return;
  const pos = getPos(attacker);
  const incomingDamage = fixedDamage || (getCombat(attacker)?.damage || 1);
  const shield = state.data.shieldHP || 0;

  if (state.current === 'CHARGING' || state.current === 'READY') {
      if (shield > 0) {
          state.data.shieldHP = Math.max(0, shield - incomingDamage);
          state.data.wasHit = true; 
          ctx.destroyEntity(attacker, attacker.hasTag('ENEMY') ? 'CLASH_YELLOW' : 'IMPACT_WHITE');
          ctx.playSpatialAudio('fx_impact_light', pos ? pos.x : 0);
          return;
      }
  }
  ctx.destroyEntity(attacker, attacker.hasTag('ENEMY') ? 'EXPLOSION_RED' : 'IMPACT_RED');
  ctx.playSpatialAudio('fx_impact_light', pos ? pos.x : 0);
}

function handleMassExchange(a: Entity, b: Entity, defaultFX: string, ctx: CombatContext, sprayAngle?: number) {
  const hpA = getHp(a); const hpB = getHp(b);
  const cA = getCombat(a); const cB = getCombat(b);
  const dmgA = cA ? cA.damage : 1; const dmgB = cB ? cB.damage : 1;

  if (hpA) hpA.current = Math.max(0, hpA.current - dmgB);
  if (hpB) hpB.current = Math.max(0, hpB.current - dmgA);

  const posA = getPos(a); const posB = getPos(b);
  if (posA) {
      let spawnedCustom = false;
      if (defaultFX === 'IMPACT_WHITE' && posB) {
          const bRender = b.getComponent<RenderData>(ComponentType.Render);
          if (bRender) {
              const maxC = Math.max(bRender.r, bRender.g, bRender.b, 1.0);
              ctx.spawnImpact(posA.x, posA.y, bRender.r / maxC, bRender.g / maxC, bRender.b / maxC, Math.atan2(posB.y - posA.y, posB.x - posA.x));
              spawnedCustom = true;
          }
      } 
      if (!spawnedCustom) ctx.spawnFX(defaultFX, posA.x, posA.y);
  }

  let soundKey = '';
  if (hpA && hpA.current <= 0) { ctx.destroyEntity(a, 'IMPACT_WHITE', sprayAngle); soundKey = 'fx_impact_light'; }
  if (hpB && hpB.current <= 0) { ctx.destroyEntity(b, 'IMPACT_WHITE', sprayAngle); soundKey = 'fx_impact_light'; }
  if (soundKey) ctx.playSpatialAudio(soundKey, posA ? posA.x : 0);
}
