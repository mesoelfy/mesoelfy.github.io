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
  
  if (pId?.variant === EnemyTypes.DAEMON) {
      resolveDaemonCollision(player, enemy, ctx);
      return;
  }

  const eId = getId(enemy);
  const combat = getCombat(enemy);
  const pos = getPos(enemy);
  const pPos = getPos(player);
  const x = pos ? pos.x : 0;

  const damage = combat ? combat.damage : 1;

  let angle = 0;
  if (pos && pPos) {
      angle = Math.atan2(pos.y - pPos.y, pos.x - pPos.x);
  }
  const sprayAngle = angle + Math.PI;

  ctx.damagePlayer(damage);
  
  const variant = eId?.variant || 'UNKNOWN';
  const fx = getExplosionType(variant, true);
  
  const trauma = damage >= 3 ? 0.5 : 0.2;
  ctx.addTrauma(trauma);

  ctx.destroyEntity(enemy, fx, sprayAngle);
  
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

function handleMassExchange(a: Entity, b: Entity, defaultFX: string, ctx: CombatContext, sprayAngle?: number) {
  const hpA = getHp(a);
  const hpB = getHp(b);
  const cA = getCombat(a);
  const cB = getCombat(b);

  const dmgA = cA ? cA.damage : 1;
  const dmgB = cB ? cB.damage : 1;

  if (hpA) hpA.current = Math.max(0, hpA.current - dmgB);
  if (hpB) hpB.current = Math.max(0, hpB.current - dmgA);

  const pos = getPos(a);
  const x = pos ? pos.x : 0;
  
  if (pos) {
      let spawnedCustom = false;
      
      // If defaultFX is white (standard hit), try to override with B's color (Attacker)
      if (defaultFX === 'IMPACT_WHITE') {
          const bRender = b.getComponent<RenderData>(ComponentType.Render);
          if (bRender) {
              // Normalize color (Assume values might be high like 4.0 from bloom)
              const maxC = Math.max(bRender.r, bRender.g, bRender.b, 1.0);
              const r = bRender.r / maxC;
              const g = bRender.g / maxC;
              const b = bRender.b / maxC;
              
              ctx.spawnImpact(pos.x, pos.y, r, g, b);
              spawnedCustom = true;
          }
      } 
      
      if (!spawnedCustom) {
          ctx.spawnFX(defaultFX, pos.x, pos.y);
      }
  }

  let soundKey = '';

  if (hpA && hpA.current <= 0) {
      ctx.destroyEntity(a, 'IMPACT_WHITE', sprayAngle); // Death effect always white transition or specialized? Left as is.
      soundKey = 'fx_impact_light';
  }
  if (hpB && hpB.current <= 0) {
      ctx.destroyEntity(b, 'IMPACT_WHITE', sprayAngle); 
      soundKey = 'fx_impact_light';
  }
  
  if (soundKey) ctx.playSpatialAudio(soundKey, x);
}
