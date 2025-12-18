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

// --- ACCESSORS ---
const getHp = (e: Entity) => e.getComponent<HealthData>(ComponentType.Health);
const getId = (e: Entity) => e.getComponent<IdentityData>(ComponentType.Identity);
const getPos = (e: Entity) => e.getComponent<TransformData>(ComponentType.Transform);
const getCombat = (e: Entity) => e.getComponent<CombatData>(ComponentType.Combat);
const getRender = (e: Entity) => e.getComponent<RenderData>(ComponentType.Render);

// --- CONFIG ---
const THEME_MAP: Record<string, string> = {
    [EnemyTypes.KAMIKAZE]: 'RED',
    [EnemyTypes.HUNTER]: 'YELLOW',
    [EnemyTypes.DRILLER]: 'PURPLE',
    [EnemyTypes.DAEMON]: 'PURPLE',
};

const getExplosionKey = (variant: string, directional: boolean) => {
    const theme = THEME_MAP[variant] || 'PURPLE';
    return directional ? `EXPLOSION_${theme}_DIR` : `EXPLOSION_${theme}`;
};

// --- VISUAL STRATEGIES ---

/**
 * Decides how to render an impact based on the entity causing it.
 * If 'overrideFX' is provided, it forces a specific VFX recipe.
 * Otherwise, it attempts to generate a dynamic colored impact from RenderData.
 */
const resolveImpactVisuals = (source: Entity, x: number, y: number, angle: number, ctx: CombatContext, overrideFX?: string) => {
    if (overrideFX) {
        ctx.spawnFX(overrideFX, x, y);
        return;
    }

    const render = getRender(source);
    if (render) {
        // Dynamic Impact: Extract color from entity (Bullet/Enemy)
        const maxC = Math.max(render.r, render.g, render.b, 1.0); // Normalize brightness
        ctx.spawnImpact(x, y, render.r / maxC, render.g / maxC, render.b / maxC, angle);
    } else {
        // Fallback
        ctx.spawnFX('IMPACT_WHITE', x, y);
    }
};

// --- HANDLERS ---

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
  ctx.destroyEntity(bullet, 'IMPACT_RED'); // Player hit is always RED warning
  ctx.playSpatialAudio('fx_impact_heavy', pos ? pos.x : 0);
};

export const handleEnemyHit = (enemy: Entity, bullet: Entity, ctx: CombatContext) => {
  const bPos = getPos(bullet);
  // Default behavior: Bullet creates a dynamic impact based on its own color
  handleMassExchange(enemy, bullet, ctx, undefined, bPos ? bPos.rotation + Math.PI : 0);
};

export const handleBulletClash = (bulletA: Entity, bulletB: Entity, ctx: CombatContext) => {
  // Override: Clashes always use the specific yellow spark effect
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

/**
 * Handles mutual damage and visual feedback.
 * @param a Entity A
 * @param b Entity B (The source of impact usually, e.g., the bullet)
 * @param ctx Context
 * @param forceFX Optional override for the impact visual (e.g. 'CLASH_YELLOW')
 * @param sprayAngle Optional angle for directional debris
 */
function handleMassExchange(a: Entity, b: Entity, ctx: CombatContext, forceFX?: string, sprayAngle?: number) {
  const hpA = getHp(a); const hpB = getHp(b);
  const cA = getCombat(a); const cB = getCombat(b);
  const dmgA = cA ? cA.damage : 1; const dmgB = cB ? cB.damage : 1;

  // 1. Apply Damage
  if (hpA) hpA.current = Math.max(0, hpA.current - dmgB);
  if (hpB) hpB.current = Math.max(0, hpB.current - dmgA);

  // 2. Resolve Visuals (Impact on A from B)
  const posA = getPos(a);
  const posB = getPos(b);
  
  if (posA) {
      const angle = posB ? Math.atan2(posB.y - posA.y, posB.x - posA.x) : 0;
      // We use 'b' (the bullet) to determine the color of the impact on 'a' (the enemy)
      resolveImpactVisuals(b, posA.x, posA.y, angle, ctx, forceFX);
  }

  // 3. Destroy if Dead
  let soundKey = '';
  if (hpA && hpA.current <= 0) { ctx.destroyEntity(a, 'IMPACT_WHITE', sprayAngle); soundKey = 'fx_impact_light'; }
  if (hpB && hpB.current <= 0) { ctx.destroyEntity(b, 'IMPACT_WHITE', sprayAngle); soundKey = 'fx_impact_light'; }
  
  if (soundKey) ctx.playSpatialAudio(soundKey, posA ? posA.x : 0);
}
