import { Entity } from '@/engine/ecs/Entity';
import { CombatContext } from './types';
import { HealthData } from '@/engine/ecs/components/HealthData';
import { IdentityData } from '@/engine/ecs/components/IdentityData';
import { AIStateData } from '@/engine/ecs/components/AIStateData';
import { TransformData } from '@/engine/ecs/components/TransformData';
import { CombatData } from '@/engine/ecs/components/CombatData';
import { RenderData } from '@/engine/ecs/components/RenderData';
import { MotionData } from '@/engine/ecs/components/MotionData';
import { EnemyTypes } from '@/engine/config/Identifiers';
import { ComponentType } from '@/engine/ecs/ComponentType';
import { VFXKey } from '@/engine/config/AssetKeys';

const getHp = (e: Entity) => e.getComponent<HealthData>(ComponentType.Health);
const getId = (e: Entity) => e.getComponent<IdentityData>(ComponentType.Identity);
const getPos = (e: Entity) => e.getComponent<TransformData>(ComponentType.Transform);
const getCombat = (e: Entity) => e.getComponent<CombatData>(ComponentType.Combat);
const getRender = (e: Entity) => e.getComponent<RenderData>(ComponentType.Render);
const getMotion = (e: Entity) => e.getComponent<MotionData>(ComponentType.Motion);
const getAI = (e: Entity) => e.getComponent<AIStateData>(ComponentType.State);

const THEME_MAP: Record<string, string> = {
    [EnemyTypes.KAMIKAZE]: 'RED',
    [EnemyTypes.HUNTER]: 'YELLOW',
    [EnemyTypes.DRILLER]: 'PURPLE',
    [EnemyTypes.DAEMON]: 'PURPLE',
};

const getExplosionKey = (variant: string, directional: boolean): VFXKey => {
    const theme = THEME_MAP[variant] || 'PURPLE';
    return (directional ? `EXPLOSION_${theme}_DIR` : `EXPLOSION_${theme}`) as VFXKey;
};

const resolveImpactVisuals = (source: Entity, x: number, y: number, angle: number, ctx: CombatContext, overrideFX?: string) => {
    if (overrideFX) {
        ctx.spawnFX(overrideFX as VFXKey, x, y);
        return;
    }

    const render = getRender(source);
    if (render) {
        const maxC = Math.max(render.r, render.g, render.b, 1.0); 
        ctx.spawnImpact(x, y, render.r / maxC, render.g / maxC, render.b / maxC, angle);
    } else {
        ctx.spawnFX('IMPACT_WHITE', x, y);
    }
};

const applyKnockback = (entity: Entity, sourcePos: TransformData | undefined, force: number) => {
    const motion = getMotion(entity);
    const pos = getPos(entity);
    const ai = getAI(entity);
    const render = getRender(entity);

    if (motion && pos && sourcePos) {
        const dx = pos.x - sourcePos.x;
        const dy = pos.y - sourcePos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0.001) {
            // Apply Impulse
            motion.vx += (dx / dist) * force;
            motion.vy += (dy / dist) * force;
            
            // Trigger Micro-Stun (Stops AI overwriting velocity)
            if (ai) ai.stunTimer = 0.15; // 150ms stun
            
            // Trigger Visual Shudder
            if (render) render.shudder = 1.0;
        }
    }
};

export const handlePlayerCrash = (player: Entity, enemy: Entity, ctx: CombatContext) => {
  const pId = getId(player);
  if (pId?.variant === EnemyTypes.DAEMON) { resolveDaemonCollision(player, enemy, ctx); return; }

  const combat = getCombat(enemy);
  const pos = getPos(enemy);
  const pPos = getPos(player);
  const damage = combat ? combat.damage : 1;

  let sprayAngle = 0;
  if (pos && pPos) sprayAngle = Math.atan2(pos.y - pPos.y, pos.x - pPos.x) + Math.PI;

  ctx.damagePlayer(damage);
  ctx.addTrauma(damage >= 3 ? 0.5 : 0.2);
  
  const variant = getId(enemy)?.variant || 'UNKNOWN';
  ctx.destroyEntity(enemy, getExplosionKey(variant, true), sprayAngle);
  
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
  
  // TUNED: Reduced force from 15.0 to 3.0 for subtle impact
  applyKnockback(enemy, bPos, 3.0);
  
  handleMassExchange(enemy, bullet, ctx, undefined, bPos ? bPos.rotation + Math.PI : 0);
};

export const handleBulletClash = (bulletA: Entity, bulletB: Entity, ctx: CombatContext) => {
  handleMassExchange(bulletA, bulletB, ctx, 'CLASH_YELLOW');
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
          
          const isEnemy = attacker.hasTag('ENEMY');
          const fx = isEnemy ? 'CLASH_YELLOW' : 'IMPACT_WHITE';
          
          ctx.destroyEntity(attacker, fx);
          ctx.playSpatialAudio('fx_impact_light', pos ? pos.x : 0);
          return;
      }
  }
  
  const isEnemy = attacker.hasTag('ENEMY');
  ctx.destroyEntity(attacker, isEnemy ? 'EXPLOSION_RED' : 'IMPACT_RED');
  ctx.playSpatialAudio('fx_impact_light', pos ? pos.x : 0);
}

function handleMassExchange(a: Entity, b: Entity, ctx: CombatContext, forceFX?: string, sprayAngle?: number) {
  const hpA = getHp(a); const hpB = getHp(b);
  const cA = getCombat(a); const cB = getCombat(b);
  const dmgA = cA ? cA.damage : 1; const dmgB = cB ? cB.damage : 1;

  if (hpA) {
      hpA.current = Math.max(0, hpA.current - dmgB);
      if (hpA.current > 0) ctx.flashEntity(a.id as number); 
  }
  if (hpB) {
      hpB.current = Math.max(0, hpB.current - dmgA);
      if (hpB.current > 0) ctx.flashEntity(b.id as number); 
  }

  const posA = getPos(a);
  const posB = getPos(b);
  
  if (posA) {
      const angle = posB ? Math.atan2(posB.y - posA.y, posB.x - posA.x) : 0;
      resolveImpactVisuals(b, posA.x, posA.y, angle, ctx, forceFX);
  }

  let soundKey = '';
  if (hpA && hpA.current <= 0) { ctx.destroyEntity(a, 'IMPACT_WHITE', sprayAngle); soundKey = 'fx_impact_light'; }
  if (hpB && hpB.current <= 0) { ctx.destroyEntity(b, 'IMPACT_WHITE', sprayAngle); soundKey = 'fx_impact_light'; }
  
  if (soundKey) ctx.playSpatialAudio(soundKey, posA ? posA.x : 0);
}
